/* tslint:disable:no-empty */
import * as _Promise from "bluebird";
import * as _ from "lodash";
import * as path from "path";
import { IIntent, Schema } from "./Schema";
import { IVoxaSheet } from "./VoxaSheet";

export class AlexaSchema extends Schema {
  public NAMESPACE = "alexa";
  public AVAILABLE_LOCALES = [
    "en-US",
    "en-GB",
    "en-CA",
    "en-AU",
    "en-IN",
    "de-DE",
    "ja-JP",
    "es-ES",
    "fr-FR",
    "it-IT"
  ];
  public environment = "staging";

  constructor(voxaSheets: IVoxaSheet[], interactionOption: any) {
    super(interactionOption);
    this.init(voxaSheets);
  }

  public validate() {}

  public build(locale: string, environment: string) {
    this.buildLanguageModel(locale, environment);
    this.buildPublishing(environment);
  }

  public buildPublishing(environment: string) {
    const manifest = this.mergeManifest(environment);
    _.set(manifest, "manifestVersion", "1.0");

    this.fileContent.push({
      path: path.join(
        this.interactionOptions.rootPath,
        "speech-assets",
        this.NAMESPACE,
        `${_.kebabCase(environment)}-manifest.json`
      ),
      content: { manifest }
    });
  }

  public buildLanguageModel(locale: string, environment: string) {
    const invocation = _.find(this.invocations, { locale, environment });
    const invocationName = _.get(invocation, "name", "Skill with no name");
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(
      locale,
      environment
    );

    const intents = intentsByPlatformAndEnvironments.map((rawIntent: IIntent) => {
      const { name, samples } = rawIntent;
      let { slotsDefinition } = rawIntent;
      slotsDefinition = slotsDefinition.map((slot: any) => {
        return {
          type: slot.type,
          name: slot.name.replace("{", "").replace("}", "")
        };
      });

      const intent = { name, samples, slots: slotsDefinition };
      return intent;
    });

    const types = this.slots.map(rawSlot => {
      const { name, values } = rawSlot;
      const slot = { name, values: values.map(value => ({ name: value })) };
      return slot;
    });

    this.fileContent.push({
      path: path.join(
        this.interactionOptions.rootPath,
        "speech-assets",
        this.NAMESPACE,
        locale,
        `${_.kebabCase(environment)}-interaction.json`
      ),
      content: { interactionModel: { languageModel: { invocationName, intents, types } } }
    });

    const canFulfillIntents = _.chain(intentsByPlatformAndEnvironments)
      .filter("canFulfillIntent")
      .map("name")
      .value();

    this.fileContent.push({
      path: path.join(
        this.interactionOptions.rootPath,
        "src/content",
        `${_.kebabCase(environment)}-canfulfill-intents.json`
      ),
      content: canFulfillIntents
    });
  }
}
