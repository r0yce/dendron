"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyMetricUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const analytics_1 = require("./analytics");
class ProxyMetricUtils {
    static trackRefactoringProxyMetric(opts) {
        const { props, extra } = opts;
        const payload = {
            ...props,
            ...extra,
        };
        analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.RefactoringCommandUsed, payload);
    }
}
exports.ProxyMetricUtils = ProxyMetricUtils;
//# sourceMappingURL=ProxyMetricUtils.js.map