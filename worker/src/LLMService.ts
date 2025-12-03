import {Context, Effect} from "effect";

export class LLMService extends Context.Tag("LLMService")<
    LLMService,
    {
        plan: (input: string) => Effect.Effect<any[], Error>;
        execute: (prompt: string, updateFn: (state: string) => Effect.Effect<void, never>) => Effect.Effect<string, Error>;
        aggregate: (results: { task_title: string; result_content: string }[], updateFn: ((state: string) => Effect.Effect<void, never>)) => Effect.Effect<string, Error>;
    }
>() {}