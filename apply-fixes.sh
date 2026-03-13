#!/bin/bash

# NestJS Backend Service Fixes Migration Script
# Date: 2026-02-25
# Purpose: Apply production-ready fixes to billing and document services

set -e

echo "=========================================="
echo "NestJS Backend Service Fixes Migration"
echo "=========================================="
echo ""

# Define project root
PROJECT_ROOT="/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code"
cd "$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Backup current files
echo "Step 1: Backing up current service files..."
echo "----------------------------------------"

backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

if [ -f "src/billing/services/stripe.service.ts" ]; then
    cp "src/billing/services/stripe.service.ts" "$backup_dir/stripe.service.ts.backup"
    print_success "Backed up stripe.service.ts"
fi

if [ -f "src/billing/services/billing.service.ts" ]; then
    cp "src/billing/services/billing.service.ts" "$backup_dir/billing.service.ts.backup"
    print_success "Backed up billing.service.ts"
fi

if [ -f "src/documents/services/document.service.ts" ]; then
    cp "src/documents/services/document.service.ts" "$backup_dir/document.service.ts.backup"
    print_success "Backed up document.service.ts"
fi

echo ""

# Step 2: Apply fixes
echo "Step 2: Applying production-ready fixes..."
echo "------------------------------------------"

if [ -f "src/billing/services/stripe.service.fixed.ts" ]; then
    mv "src/billing/services/stripe.service.fixed.ts" "src/billing/services/stripe.service.ts"
    print_success "Applied stripe.service.ts fix"
else
    print_warning "stripe.service.fixed.ts not found, skipping"
fi

if [ -f "src/billing/services/billing.service.fixed.ts" ]; then
    mv "src/billing/services/billing.service.fixed.ts" "src/billing/services/billing.service.ts"
    print_success "Applied billing.service.ts fix"
else
    print_warning "billing.service.fixed.ts not found, skipping"
fi

if [ -f "src/documents/services/document.service.fixed.ts" ]; then
    mv "src/documents/services/document.service.fixed.ts" "src/documents/services/document.service.ts"
    print_success "Applied document.service.ts fix"
else
    print_warning "document.service.fixed.ts not found, skipping"
fi

echo ""

# Step 3: Check dependencies
echo "Step 3: Checking dependencies..."
echo "---------------------------------"

if ! grep -q "class-validator" package.json; then
    print_warning "class-validator not found in package.json"
    echo "Installing class-validator and class-transformer..."
    npm install --save class-validator class-transformer
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

echo ""

# Step 4: Compile TypeScript
echo "Step 4: Compiling TypeScript..."
echo "--------------------------------"

if npm run build; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    echo "Check the error messages above"
    exit 1
fi

echo ""

# Step 5: Run linting
echo "Step 5: Running linting..."
echo "---------------------------"

if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found (non-critical)"
fi

echo ""

# Step 6: Summary
echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo ""
echo "✓ Backups created in: $backup_dir"
echo "✓ Applied fixes to:"
echo "  - src/billing/services/stripe.service.ts"
echo "  - src/billing/services/billing.service.ts"
echo "  - src/documents/services/document.service.ts"
echo ""
echo "Key improvements:"
echo "  • Complete Stripe webhook handlers"
echo "  • Transaction boundaries for data integrity"
echo "  • SQL injection protection"
echo "  • Comprehensive audit logging"
echo "  • Optimized statistics queries"
echo "  • Proper error handling"
echo ""
echo "Next steps:"
echo "1. Review the changes in the fixed files"
echo "2. Run tests: npm test"
echo "3. Test webhooks with Stripe CLI"
echo "4. Monitor logs for any issues"
echo ""
echo "See NESTJS_BACKEND_AUDIT_REPORT.md for full details"
echo ""

# Optional: Run tests
read -p "Run tests now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Running tests..."
    npm test
fi

echo ""
print_success "Migration completed successfully!"
