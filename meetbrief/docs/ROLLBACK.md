# Branching and rollback

## Starting point

No MeetBrief code existed in this repository. The repository root is the SIMCOSA 84-85 alumni site
(TanStack Start, deployed from the root `vercel.json`). MeetBrief was added as a self-contained
folder, `meetbrief/`, on a feature branch. **No file outside `meetbrief/` was changed**, so the
alumni site's build and deployment are unaffected.

## Rolling back

- **Before merge:** close the pull request or delete the feature branch. Nothing else to undo.
- **After merge, code only:** `git revert <merge-commit>` removes the folder; the alumni site is untouched.
- **Frontend:** in Vercel, use "Promote to production" on the previous MeetBrief deployment, or
  remove the MeetBrief Vercel project. The alumni Vercel project is separate.
- **Backend:** Cloud Run keeps revisions. Roll back with
  `gcloud run services update-traffic meetbrief-api --to-revisions <previous>=100` (same for
  `meetbrief-worker`).
- **Rules:** keep the last deployed `firestore.rules` / `storage.rules` in git; redeploy the previous
  version with `firebase deploy --only firestore:rules,storage`.
- **Data:** user data lives only in Firestore and Storage under the MeetBrief Firebase project.
  Enable Firestore point-in-time recovery and scheduled exports, and Storage object versioning,
  before going live so data can be restored independently of code rollbacks.

## Later upgrades

Data model changes should be additive (new optional fields). If a migration is needed, write it as
an idempotent script that reads old and new shapes, and run it after the new code is deployed.
