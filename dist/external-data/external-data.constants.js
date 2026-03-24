"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get EXTERNAL_DATA_SOURCE_DEFINITIONS () {
        return EXTERNAL_DATA_SOURCE_DEFINITIONS;
    },
    get buildDefaultExternalDataDefinitions () {
        return buildDefaultExternalDataDefinitions;
    }
});
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const EXTERNAL_DATA_SOURCE_DEFINITIONS = "EXTERNAL_DATA_SOURCE_DEFINITIONS";
const parseUrls = (value, fallbackName)=>{
    return (value || "").split(",").map((entry)=>entry.trim()).filter(Boolean).map((url, index)=>({
            name: `${fallbackName}-${index + 1}`,
            url
        }));
};
const buildDefaultExternalDataDefinitions = ()=>[
        {
            code: "court_stan",
            datasetUrl: process.env.EXTERNAL_DATASET_URL_COURT_STAN,
            targetDirectory: _path.resolve(process.cwd(), "court_stan"),
            indexedSource: "court_stan",
            resources: parseUrls(process.env.EXTERNAL_DATA_URLS_COURT_STAN, "court-stan")
        },
        {
            code: "court_dates",
            datasetUrl: process.env.EXTERNAL_DATASET_URL_COURT_DATES,
            targetDirectory: _path.resolve(process.cwd(), "court_dates"),
            indexedSource: "court_dates",
            resources: parseUrls(process.env.EXTERNAL_DATA_URLS_COURT_DATES, "court-dates")
        },
        {
            code: "reestr",
            datasetUrl: process.env.EXTERNAL_DATASET_URL_REESTR,
            targetDirectory: _path.resolve(process.cwd(), "reestr"),
            resources: parseUrls(process.env.EXTERNAL_DATA_URLS_REESTR, "reestr")
        },
        {
            code: "asvp",
            datasetUrl: process.env.EXTERNAL_DATASET_URL_ASVP,
            targetDirectory: _path.resolve(process.cwd(), "asvp"),
            indexedSource: "asvp",
            resources: parseUrls(process.env.EXTERNAL_DATA_URLS_ASVP, "asvp")
        }
    ];

//# sourceMappingURL=external-data.constants.js.map