declare module "open-graph-scraper" {
  namespace ogs {
    type Options = { url: string; [key: string]: unknown };
    type SuccessResult = {
      result: {
        ogTitle?: string;
        twitterTitle?: string;
        dcTitle?: string;
        ogDescription?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  }
  function ogs(opts: ogs.Options): Promise<ogs.SuccessResult>;
  export = ogs;
}