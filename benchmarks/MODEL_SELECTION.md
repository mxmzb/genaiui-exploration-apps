# Selected comparison models — November 3, 2026

Maxim approved the proposed model pool and added GPT-6.1 Terra and Claude Opus
5.5. The Terra name refers to the GPT-6.1 model discussed in the shortlist.

| Model | OpenRouter ID |
| --- | --- |
| GPT-6.1 Sol | `openai/gpt-6.1-sol` |
| GPT-6.1 Terra | `openai/gpt-6.1-terra` |
| GPT-6 Luna | `openai/gpt-6-luna` |
| Claude Opus 5.5 | `anthropic/claude-opus-5.5` |
| Claude Sonnet 5.5 | `anthropic/claude-sonnet-5.5` |
| Claude Haiku 5.5 | `anthropic/claude-haiku-5.5` |
| Gemini 4 Argon | `google/gemini-4-argon` |
| Gemini 3.8 Flash | `google/gemini-3.8-flash` |
| DeepSeek V4.1 Flash, October 17 snapshot | `deepseek/deepseek-v4.1-flash-1017` |
| Qwen3.8 27B | `qwen/qwen3.8-27b` |

The local candidate is Qwen3.8 27B; its runtime, exact artifact, quantization and
context configuration remain to be chosen and verified. The older installed
Qwen3.8 Flash Next 125B MLX entry is retained as inventory, not silently added to
the selected matrix.

`models.json` contains the November 3 catalog snapshot. Advertised capabilities
and catalog prices are planning inputs, not verified endpoint compatibility or
guaranteed charges. Pin each serving route and reasoning configuration, verify
streaming/tools/structured outputs, and record actual usage in a small pilot.
Then determine repetitions and execution order within the existing cumulative
$30 campaign cap.

This selection does not change the example apps' model defaults or the earlier
live runners' hardcoded pilot configurations. No comparison run has started.
The shared json-render paid route still needs wiring. Full journeys and a demo
submission endpoint that persists application data are separate remaining work.
