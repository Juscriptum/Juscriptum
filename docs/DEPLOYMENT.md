# Deployment Guide - Law Organizer

## Production Deployment Checklist

### Prerequisites

- [ ] Kubernetes cluster (v1.28+)
- [ ] kubectl configured
- [ ] Helm 3.x installed
- [ ] Container registry access (ghcr.io)
- [ ] Domain name configured
- [ ] SSL certificates (Let's Encrypt)

### 1. Infrastructure Setup

#### Required Kubernetes Addons

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Install Cert-Manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# Install Prometheus Stack (monitoring)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
```

#### Database (PostgreSQL)

```bash
# Install PostgreSQL using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql \
  --namespace database --create-namespace \
  --set auth.postgresPassword=CHANGE_ME \
  --set auth.database=law_organizer \
  --set primary.persistence.size=50Gi \
  --set primary.resources.requests.memory=1Gi \
  --set primary.resources.limits.memory=2Gi
```

#### Redis

```bash
# Install Redis
helm install redis bitnami/redis \
  --namespace database \
  --set auth.password=CHANGE_ME \
  --set replica.replicaCount=2 \
  --set master.persistence.size=10Gi
```

### 2. Secrets Management

**IMPORTANT**: Never commit secrets to Git. Use Sealed Secrets or External Secrets Operator.

#### Option A: Sealed Secrets (Recommended)

```bash
# Install Sealed Secrets
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system

# Encrypt secrets
kubeseal --format=yaml < k8s/00-config.yaml > k8s/00-config-sealed.yaml
```

#### Option B: Manual Secret Creation

```bash
# Create namespace
kubectl create namespace law-organizer

# Create secrets from literal values
kubectl create secret generic database-secret \
  --from-literal=host=postgres-postgresql.database.svc.cluster.local \
  --from-literal=user=law_organizer \
  --from-literal=password=$(openssl rand -base64 32) \
  --from-literal=name=law_organizer \
  -n law-organizer

kubectl create secret generic redis-secret \
  --from-literal=host=redis-master.database.svc.cluster.local \
  --from-literal=password=$(openssl rand -base64 32) \
  -n law-organizer

kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 64) \
  --from-literal=encryption-key=$(openssl rand -hex 32) \
  -n law-organizer
```

### 3. Deploy Application

```bash
# Apply configurations
kubectl apply -f k8s/00-config.yaml

# Deploy backend
kubectl apply -f k8s/01-backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/02-frontend-deployment.yaml

# Deploy worker
kubectl apply -f k8s/03-worker-deployment.yaml

# Apply ingress
kubectl apply -f k8s/04-ingress.yaml

# Apply monitoring
kubectl apply -f k8s/05-monitoring.yaml

# Apply backup jobs
kubectl apply -f k8s/06-backup.yaml
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n law-organizer

# Check services
kubectl get svc -n law-organizer

# Check ingress
kubectl get ingress -n law-organizer

# Check HPA
kubectl get hpa -n law-organizer

# View logs
kubectl logs -f deployment/law-organizer-backend -n law-organizer

# Port forward for local testing
kubectl port-forward svc/law-organizer-backend 3000:3000 -n law-organizer
```

### 5. DNS Configuration

Point your domain to the ingress controller:

```bash
# Get ingress IP
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

Configure DNS records:
- `laworganizer.ua` -> Ingress IP
- `www.laworganizer.ua` -> Ingress IP
- `api.laworganizer.ua` -> Ingress IP

### 6. SSL Certificate

Cert-Manager will automatically provision Let's Encrypt certificates.

```bash
# Check certificate status
kubectl get certificate -n law-organizer

# Describe certificate for troubleshooting
kubectl describe certificate law-organizer-tls -n law-organizer
```

### 7. Database Migrations

```bash
# Run migrations
kubectl exec -it deployment/law-organizer-backend -n law-organizer -- \
  npm run migration:run
```

### 8. Monitoring Setup

Access Grafana:

```bash
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

Default credentials: admin/prom-operator

Import dashboard from `k8s/05-monitoring.yaml`

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment law-organizer-backend --replicas=5 -n law-organizer

# Scale frontend
kubectl scale deployment law-organizer-frontend --replicas=3 -n law-organizer
```

### Auto-Scaling

HPA is configured automatically. Monitor with:

```bash
kubectl get hpa -n law-organizer
kubectl describe hpa law-organizer-backend-hpa -n law-organizer
```

## Rollback

```bash
# View rollout history
kubectl rollout history deployment/law-organizer-backend -n law-organizer

# Rollback to previous version
kubectl rollout undo deployment/law-organizer-backend -n law-organizer

# Rollback to specific revision
kubectl rollout undo deployment/law-organizer-backend --to-revision=2 -n law-organizer
```

## Backup & Restore

Operator runbooks:

- Blind-index / encryption-key rotation:
  [BLIND_INDEX_KEY_ROTATION_RUNBOOK.md](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code/docs/BLIND_INDEX_KEY_ROTATION_RUNBOOK.md)
- Production-scale backfill rehearsal:
  [PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code/docs/PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md)

### Manual Backup

```bash
# Trigger backup job
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%s) -n law-organizer
```

### Restore Database

```bash
# Download backup from S3
aws s3 cp s3://law-organizer-backups/database/law_organizer_YYYYMMDD_HHMMSS.sql.gz.enc .

# Decrypt (if encrypted)
openssl enc -aes-256-cbc -d -in law_organizer_*.sql.gz.enc -out backup.sql.gz -pass pass:YOUR_KEY

# Decompress
gunzip backup.sql.gz

# Restore
kubectl exec -i postgres-postgresql-0 -n database -- \
  psql -U law_organizer -d law_organizer < backup.sql
```

## Troubleshooting

### Common Issues

#### Pods not starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n law-organizer

# Check events
kubectl get events -n law-organizer --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n law-organizer --previous
```

#### Database connection issues

```bash
# Test connectivity
kubectl run pg-test --rm -it --image=postgres:16-alpine -- \
  psql postgresql://user:password@postgres-postgresql.database.svc.cluster.local:5432/law_organizer
```

#### Ingress not working

```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Check ingress configuration
kubectl describe ingress law-organizer-ingress -n law-organizer
```

## Security Hardening

### Network Policies

```bash
# Apply network policies (restrict inter-namespace communication)
kubectl apply -f k8s/network-policies.yaml
```

### Pod Security Standards

```bash
# Label namespace for restricted policy
kubectl label --overwrite ns law-organizer \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest
```

## Maintenance

### Update Application

```bash
# Update image
kubectl set image deployment/law-organizer-backend \
  backend=ghcr.io/laworganizer/backend:v1.2.3 \
  -n law-organizer

# Monitor rollout
kubectl rollout status deployment/law-organizer-backend -n law-organizer
```

### Update ConfigMap

```bash
# Edit configmap
kubectl edit configmap app-config -n law-organizer

# Restart pods to pick up changes
kubectl rollout restart deployment/law-organizer-backend -n law-organizer
```

## Cost Optimization

- Use spot instances for non-critical workloads
- Configure resource requests/limits properly
- Use cluster autoscaler
- Enable vertical pod autoscaler (VPA)
- Use reserved instances for stable workloads

## Support

For issues, check:
1. Application logs
2. Kubernetes events
3. Monitoring dashboards
4. Sentry for error tracking
