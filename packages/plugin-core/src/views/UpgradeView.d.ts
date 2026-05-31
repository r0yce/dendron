/**
 * This was an attempt at a webview that displays the changelog.
 *
 * There are a few known issues with this view:
 * - It displays the entire changelog page, which includes the entire history
 *   and not just what was changed
 * - It's hard to collect any telemetry from the view because of VSCode/iframe
 *   security policies
 * - The displayed page doesn't function properly because VSCode disables
 *   javascript inside of it
 * - Clicking any link inside the view opens that page inside the view as well,
 *   rather than opening it with the default browser
 *
 * As a result, we decided to not roll out this view. If we ever decide to
 * reintroduce this, consider the bugs above.
 *
 * */
export declare function showUpgradeView(): void;
