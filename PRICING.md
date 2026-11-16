# Stargaze pricing decision

Date: 2026-11-17. Status: proposed, waiting for Samay's sign-off. No products created yet.

## Competitor prices (US, from web sources on the date above)

| App | Model | Monthly | Yearly | One-time / lifetime | Trial | Source |
|---|---|---|---|---|---|---|
| Night Sky | Free + subscription | $5.99 | $39.99 | - | not confirmed | space.com best stargazing apps 2026; vitotechnology.com |
| Sky Guide Plus | Free + subscription | $3.99 | $29.99 | - | yes (length not confirmed) | adapty.io paywall library |
| Sky Guide Pro | Free + subscription | $6.99 | $49.99 | $249.99 lifetime | yes | adapty.io paywall library |
| Stellarium Mobile Plus | Free + one-time upgrade | - | - | $18.99 to $19.99 | none | App Store listing; space.com |
| SkyView (paid) | Paid app | - | - | $1.99 | none | space.com |
| Star Walk 2 Plus | Free with ads + subscription | monthly (price not confirmed) | - | - | 1 week | AppFollow store description |

Older sources list lower Sky Guide prices ($19.99 and $39.99 per year); the adapty.io figures are the most recent.

## Choice

Stargaze Pro unlocks a fixed set of content (fainter stars, Messier objects, Tonight planner, longer time travel). That is a one-off utility upgrade, not ongoing content, so lifetime is the honest lead offer, with a low yearly plan beside it for people who prefer to try first.

| Offering | Yearly (7-day free trial) | Lifetime | Role |
|---|---|---|---|
| `default` | $9.99 | $14.99 | Main |
| `variant_b` | $12.99 | $19.99 | 50/50 experiment against `default` for at least 28 days |

Reasoning: Stargaze Pro is much smaller than Night Sky+ or Sky Guide Plus, so it is priced well under their $29.99 to $39.99 per year, and the lifetime price sits below Stellarium Plus ($18.99), the closest one-time competitor.

## Identifiers

| Item | Value |
|---|---|
| Entitlement | `premium` |
| Yearly product | `stargaze_pro_yearly` (subscription group "Stargaze Pro") |
| Lifetime product | `stargaze_pro_lifetime` (non-consumable) |
| Variant products | `stargaze_pro_yearly_b`, `stargaze_pro_lifetime_b` |
| Packages | `$rc_annual`, `$rc_lifetime` |

## Local pricing

Base price in USD, store-equalised everywhere, then lowered by hand in India, Indonesia, Brazil, Turkey, Mexico, Egypt, Pakistan, Nigeria, Philippines and Vietnam.
