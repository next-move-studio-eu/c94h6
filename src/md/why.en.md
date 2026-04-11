# Why Do We Do It This Way?

We believe content and data should remain in the hands of those who create them — not locked into platforms built around monetizing attention.

* **LLM can handle it:** If you want to trim code with a flint knife, go ahead. We're betting that content creators can handle basic technical challenges to deliver a top-tier product.
* **Prompt it:** Don't know DOT format syntax? Neither do we. Toss your LLM assistant a prompt for a TCP/IP handshake diagram and the result will drop before you even get to your coffee.
* **Where's my JPG?** Our format is just a container (JSON + ZIP). It can hold anything, but on the web we run AVIF and AV1 only. That's why we didn't teach the editor JPG, PNG, or H.264. On the home screen you'll find our internal media conversion scripts — use them and you're sorted.
* **Extensibility:** JSON + ZIP is freedom. Want a custom element? Add `"type":"whatever-you-want"`. The editor will gracefully skip that block in preview. Want it in the editor too? It's open source, fork it.
* **Sponsor development:** Need a specific block, it's general enough, you don't want your own fork, and you want it part of the official editor? Write to us. We'll assess the development cost and if it makes sense, we'll add it to the main branch.

**Still here? Welcome to the club.**