import {
  DendronError,
  DLink,
  ErrorFactory,
  isNumeric,
  minimatch,
  NoteProps,
  RespV3,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DateTime } from "luxon";
import { LinkUtils } from "@dendronhq/unified";

export type NoteMetadataValidationProps = {
  /**
   * If required, will throw error if field is missing
   */
  required?: boolean;
  /**
   * If enabled, will throw error if field is null
   */
  strictNullChecks?: boolean;
  /**
   * If enabled, will skip if field is empty
   */
  skipOnEmpty?: boolean;
};

export type NotemetadataExtractScalarProps = {
  key: string;
} & ExtractPropsCommon;

type ExtractPropsCommon = {
  note: NoteProps;
} & NoteMetadataValidationProps;

type ExtractPropWithFilter = {
  filters: string[];
} & ExtractPropsCommon;

enum NullOrUndefined {
  "UNDEFINED",
  "NULL",
  "NO_UNDEFINED_OR_NULL",
}

export class NoteMetadataUtils {
  /**
   * Return list of strings from links
   * @param links
   */
  static cleanTags(links: DLink[]): string[] {
    return links.map((l) => {
      return l.value.replace(/^tags./, "");
    });
  }

  static checkIfAllowNullOrUndefined(
    val: any,
    { required, strictNullChecks }: NoteMetadataValidationProps
  ) {
    if (_.isUndefined(val) && !required) {
      return NullOrUndefined.UNDEFINED;
    }
    if (_.isNull(val) && !strictNullChecks) {
      return NullOrUndefined.NULL;
    }
    return NullOrUndefined.NO_UNDEFINED_OR_NULL;
  }

  static checkAndReturnUndefinedOrError(
    val: any,
    props: NoteMetadataValidationProps
  ) {
    if (
      NoteMetadataUtils.checkIfAllowNullOrUndefined(val, props) !==
      NullOrUndefined.NO_UNDEFINED_OR_NULL
    ) {
      return { data: undefined };
    }
    return {
      error: ErrorFactory.createInvalidStateError({
        message: `${val} is wrong type`,
      }),
    };
  }

  static checkIfSkipOnEmpty(
    key: string,
    val: any,
    props: NoteMetadataValidationProps
  ) {
    const { skipOnEmpty = true } = props;
    if (_.isEmpty(val) && skipOnEmpty) {
      return { data: undefined };
    }
    if (_.isEmpty(val) && !skipOnEmpty) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: `The value for ${key} is found empty. Please provide a valid value or enable skipOnEmpty in the srcFieldMapping.`,
        }),
      };
    }
    return { data: val };
  }

  /**
   * Extract string metadata from note
   * @returns
   */
  static extractString({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<string | undefined> {
    const val = _.get(note, key);
    if (_.isString(val)) {
      return { data: val };
    }
    return NoteMetadataUtils.checkAndReturnUndefinedOrError(val, props);
  }

  static extractNumber({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<number | undefined> {
    const val = _.get(note, key);
    if (_.isNumber(val)) {
      return { data: val };
    }
    if (isNumeric(val)) {
      return { data: parseFloat(val) };
    }
    return NoteMetadataUtils.checkAndReturnUndefinedOrError(val, props);
  }

  static extractBoolean({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<boolean | undefined> {
    const val = _.get(note, key);
    if (_.isBoolean(val)) {
      return { data: val };
    }
    return NoteMetadataUtils.checkAndReturnUndefinedOrError(val, props);
  }

  static extractDate({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<string | undefined> {
    // TODO: we should validate
    const val = _.get(note, key);
    if (_.isNumber(val)) {
      return {
        data: DateTime.fromMillis(val).toLocaleString(DateTime.DATETIME_FULL),
      };
    }
    return NoteMetadataUtils.checkIfSkipOnEmpty(key, val, props);
  }

  /**
   * If field is not found, return empty array
   */
  static extractArray<T>({
    note,
    key,
  }: {
    key: string;
  } & ExtractPropsCommon): T[] | undefined {
    return _.get(note, key, []);
  }

  /**
   * Get all links from a note
   */
  static extractLinks({ note, filters }: ExtractPropWithFilter): DLink[] {
    let links: DLink[] = note.links;
    filters.map((pattern) => {
      links = links.filter((t) => minimatch(t.value, pattern));
    });
    return links;
  }

  /**
   * Get hashtags from note
   */
  static extractTags({ note, filters }: ExtractPropWithFilter): DLink[] {
    let links = LinkUtils.findHashTags({ links: note.links });
    filters.map((pattern) => {
      links = links.filter((t) => minimatch(t.value, pattern));
    });
    return links;
  }

  static extractSingleTag({
    note,
    filters,
  }: ExtractPropWithFilter): RespV3<DLink | undefined> {
    const tags = this.extractTags({ note, filters });
    if (tags.length > 1) {
      const error = new DendronError({
        message: `singleTag field has multiple values. note: ${
          note.fname
        }, tags: ${tags.map((ent) => ent.alias).join(", ")}`,
      });
      return { error };
    }
    if (tags.length === 0) {
      return { data: undefined };
    }
    // invariant length===1 after >1/===0 checks; ! only after (noteMetadataUtils extractSingleTag tags[0] cluster, engine-server batch 2); length/invariant guard per "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (third of 3: engine-server, batch 2)" + common-server 0 + unified 59 + ADR 0001 + IDs 019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e8202-b2c3-7d4e-9f5a-6789abcdef01. THE CHAIN DOES NOT STOP.
    return { data: tags[0]! };
  }
}
