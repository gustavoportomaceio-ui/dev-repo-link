<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep catalog selection in checkout and order forms tied to registered items, with quantity-based prices, so sales use consistent product/service data.
- Define the screen theme and separate print receipt colors in semantic CSS tokens, so dark screens still produce readable paper receipts.
- Render thermal receipts in a body portal with dedicated 58 mm print rules; why: print-hidden application shells must never hide the receipt.

- Data lives in Lovable Cloud table app_state (one JSON row per store key), read/written only via server functions after the password session check; why: no user accounts, so RLS stays locked.
- Password gate uses an encrypted session cookie (sessao.server.ts) checked server-side; why: password never reaches the browser.
