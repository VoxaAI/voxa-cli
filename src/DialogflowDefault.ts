export const AGENT = {
  description: "description",
  activeAssistantAgents: [],
  disableInteractionLogs: false,
  googleAssistant: {
    googleAssistantCompatible: true,
    project: "project",
    welcomeIntentSignInRequired: false,
    systemIntents: [],
    oAuthLinking: {
      required: false,
      grantType: "AUTH_CODE_GRANT"
    },
    voiceType: "MALE_1",
    capabilities: [],
    protocolVersion: "V2",
    autoPreviewEnabled: true,
    isDeviceAgent: false
  },
  defaultTimezone: "America/New_York",
  webhook: {
    url: "webhook.url",
    headers: {},
    available: true,
    useForDomains: true,
    cloudFunctionsEnabled: false,
    cloudFunctionsInitialized: false
  },
  isPrivate: true,
  customClassifierMode: "use.after",
  mlMinConfidence: 0.2,
  supportedLanguages: [],
  onePlatformApiVersion: "v2beta1"
};

export const BUILT_IN_INTENTS = {
  HelpIntent: ["help", "help me", "can you help me"],
  StopIntent: ["stop", "off", "shut up"],
  CancelIntent: ["cancel", "never mind", "forget it"],
  YesIntent: [
    "okay",
    "of course",
    "i don't mind",
    "do it",
    "ok",
    "sounds good",
    "confirm",
    "that's correct",
    "I agree",
    "exactly",
    "yes",
    "yes please",
    "sure"
  ],
  NoIntent: [
    "no",
    "I disagree",
    "not really",
    "not interested",
    "I don't want that",
    "I don't think so",
    "definitely not",
    "don't do it",
    "no thanks"
  ],
  PauseIntent: ["pause", "pause that"],
  ResumeIntent: ["continue", "resume", "continue", "keep going"],
  RepeatIntent: ["repeat", "say that again", "repeat that"],
  StartOverIntent: ["start over", "restart", "start again"],
  PreviousIntent: ["go back", "skip back", "back up"],
  NextIntent: ["next", "skip", "skip forward"],
  LoopOffIntent: ["loop off"],
  LoopOnIntent: ["loop", "loop on", "keep playing this"],
  ShuffleOffIntent: ["stop shuffling", "shuffle off", "turn off shuffle"],
  ShuffleOnIntent: ["shuffle", "shuffle on", "shuffle the music", "shuffle mode"]
};
