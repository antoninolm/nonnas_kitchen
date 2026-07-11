[33mcommit a619d8e661a3d07bca58b8791036b638be90a3c4[m
Author: Antonino La Manna <anto.lamanna1@gmail.com>
Date:   Fri Jul 10 20:51:41 2026 +0200

    docs: record city-filter design note in SPEC §3
    
    Experience has no city field; the city param on GET /experiences
    resolves via a two-step query on HostProfile (decided in Task 5).
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

[1mdiff --git a/docs/SPEC.md b/docs/SPEC.md[m
[1mindex d7e2c95..3466507 100644[m
[1m--- a/docs/SPEC.md[m
[1m+++ b/docs/SPEC.md[m
[36m@@ -64,6 +64,8 @@[m [mPayments[m
 [m
 MethodRouteProtectionNotesPOST/api/create-checkout-sessionJWTVercel serverless function, Stripe Checkout[m
 [m
[32m+[m[32mNote: Experience has no city field of its own — city lives on HostProfile. The city filter on GET /experiences resolves in two steps: first find matching HostProfile ids by city, then query Experience with host: { $in: ids }. Decided in Task 5.[m
[32m+[m
 Cross-cutting rules[m
 [m
 [m
