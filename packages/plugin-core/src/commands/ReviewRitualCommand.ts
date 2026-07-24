import {
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  Time,
} from "@dendronhq/common-all";
import _ from "lodash";
import { QuickPickItem, QuickPickItemKind, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = void;

type ReviewItem = QuickPickItem & {
  note?: NotePropsMeta;
  action?: "open-review-note" | "open-note";
};

/**
 * Sprint 3: Daily/weekly review ritual.
 * Surfaces recently updated notes and a review log note for the period.
 */
export class ReviewRitualCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.REVIEW_RITUAL.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const period = await window.showQuickPick(
      [
        {
          label: "Daily review",
          description: "Notes updated in the last 24 hours",
          period: "daily" as const,
        },
        {
          label: "Weekly review",
          description: "Notes updated in the last 7 days",
          period: "weekly" as const,
        },
      ],
      {
        title: "Dendron Review Ritual",
        placeHolder: "Choose review window",
      }
    );
    if (!period) {
      return;
    }

    const now = Time.now().toSeconds();
    const windowSeconds = period.period === "daily" ? 86400 : 7 * 86400;
    const cutoff = now - windowSeconds;

    const engine = this._ext.getEngine();
    let allMeta = await engine.findNotesMeta({ excludeStub: true });
    allMeta = WorkspaceModesService.filterNotesByFocus(allMeta);
    const recent = _.orderBy(
      allMeta.filter(
        (n) =>
          !n.stub &&
          n.updated >= cutoff &&
          !n.fname.startsWith("root") &&
          !n.fname.startsWith("review.")
      ),
      (n) => n.updated,
      "desc"
    ).slice(0, 40);

    const reviewFname =
      period.period === "daily"
        ? `review.daily.${Time.now().toFormat("y.MM.dd")}`
        : `review.weekly.${Time.now().toFormat("y.WW")}`;

    const items: ReviewItem[] = [
      {
        label: `$(book) Open / create ${reviewFname}`,
        description: "Your review log for this period",
        action: "open-review-note",
      },
      {
        label: "Recently updated notes",
        kind: QuickPickItemKind.Separator,
        description: `${recent.length} notes`,
      },
      ...recent.map((note): ReviewItem => {
        const ageH = Math.max(0, Math.round((now - note.updated) / 3600));
        return {
          label: `$(file) ${note.fname}`,
          description: note.title,
          detail: `updated ~${ageH}h ago`,
          note,
          action: "open-note",
        };
      }),
    ];

    if (recent.length === 0) {
      items.push({
        label: "No notes updated in this window",
        description: "Try weekly review, or write something new",
      });
    }

    const picked = await window.showQuickPick(items, {
      title: `Review · ${period.label}`,
      placeHolder: "Pick a note to revisit, or open your review log",
      matchOnDescription: true,
      matchOnDetail: true,
    });
    if (!picked || !picked.action) {
      return;
    }

    if (picked.action === "open-review-note") {
      await this.openOrCreateReviewNote(reviewFname, recent, period.period);
      return;
    }

    if (picked.action === "open-note" && picked.note) {
      await new GotoNoteCommand(this._ext).execute({
        qs: picked.note.fname,
        vault: picked.note.vault,
      });
    }
  }

  private async openOrCreateReviewNote(
    fname: string,
    recent: NotePropsMeta[],
    period: "daily" | "weekly"
  ) {
    const engine = this._ext.getEngine();
    const vault = WorkspaceModesService.resolveWriteVault();
    if (!vault) {
      window.showErrorMessage("No vault available for review note");
      return;
    }

    let note = (await engine.findNotes({ fname, vault }))[0];
    if (!note) {
      const checklist = recent
        .map((n) => `- [ ] [[${n.title}|${n.fname}]]`)
        .join("\n");
      const body = [
        `# ${period === "daily" ? "Daily" : "Weekly"} Review`,
        "",
        `Created ${Time.now().toFormat("y-MM-dd HH:mm")}`,
        "",
        "## Notes to revisit",
        checklist || "_No recently updated notes in this window._",
        "",
        "## Reflections",
        "",
        "- What moved forward?",
        "- What should I pick up next?",
        "",
      ].join("\n");

      note = NoteUtils.create({
        fname,
        vault,
        body,
        title: period === "daily" ? "Daily Review" : "Weekly Review",
      }) as NoteProps;
      await engine.writeNote(note);
    }

    await new GotoNoteCommand(this._ext).execute({
      qs: note.fname,
      vault: note.vault,
    });
    window.showInformationMessage(`Review ritual: opened ${fname}`);
  }
}
