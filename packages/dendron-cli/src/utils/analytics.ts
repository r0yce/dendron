import { AppNames, RuntimeUtils } from "@dendronhq/common-all";
import { SegmentClient, SegmentUtils } from "@dendronhq/common-server";
import { CLIUtils } from "./cli";

export class CLIAnalyticsUtils {
  static track(event: string, props?: any) {
    const cliVersion = CLIUtils.getClientVersion();
    SegmentUtils.track({
      event,
      platformProps: { type: AppNames.CLI, cliVersion },
      properties: props,
    });
  }

  static async trackSync(event: string, props?: any) {
    const cliVersion = CLIUtils.getClientVersion();
    await SegmentUtils.trackSync({
      event,
      platformProps: { type: AppNames.CLI, cliVersion },
      properties: props,
    });
  }

  static identify() {
    const cliVersion = CLIUtils.getClientVersion();
    SegmentClient.unlock();
    SegmentUtils.identify({ type: AppNames.CLI, cliVersion });
  }

  /**
   * Show notice about telemetry
   */
  static showTelemetryMessage() {
    if (RuntimeUtils.isRunningInTestOrCI()) {
      return;
    }
    const message = [
      "Dendron collects limited anonymous usage data to improve the tool.",
      "Learn more: https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html",
      "To opt out: https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html#how-to-opt-out-of-data-collection",
    ].join("\n");
    const header = "\n🌱 Telemetry notice\n";
    // eslint-disable-next-line no-console
    console.log(`${header}${message}\n`);
  }
}
