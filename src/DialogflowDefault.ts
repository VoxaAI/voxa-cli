/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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
