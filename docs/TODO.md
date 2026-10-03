# Known defects and open work

Reviewed against current source and regression-test coverage on 2026-10-02.
This is a backlog review, not a new full-suite or cross-platform certification.
Completed work is summarized below; historical investigations remain in Git history.
The older [implementation gaps review](jsonforms-react-antd-implementation-gaps.md)
is background evidence and may predate fixes. Reproduce its claims before acting.

## Current implementation gaps and verification work

- [ ] **Default inline object errors.** Current objectControl.test.tsx still
  passes assertions that minProperties and forbidden-key message text is absent
  in its fixture. Shared container indicators exist, so this is a specific
  inline/discoverability gap, not universal absence of object feedback. Verify
  default and configured presentations before closing it.
- [ ] **Stale legacy-detail regression.** objectControl.test.tsx still expects
  elements-only detail layouts to be ignored. It now fails because the shared
  detail resolver deliberately normalizes them to VerticalLayout. Update that
  expectation to the supported layout semantics; preserve the field-selection
  assertion rather than dropping the test.

- [ ] **Required-state accessibility when hiding the asterisk.** The old claim
  that ordinary controls ignore hideRequiredAsterisk is obsolete: Antd
  ControlFormItem consumes it, and requiredAsterisk.test.tsx covers local/global
  precedence and retained validation. However, it passes showRequired to
  Form.Item.required. Verify that accessible required state survives hiding the
  marker across controls and cells; the existing test does not prove that.
- [ ] **Pre-touch container summaries.** Audit array, tuple, object and descendant
  indicators against touch filtering. Ordinary control filtering and container
  validation indicators exist; their presence is not proof of touch-aware
  summaries. Resolve a consistent policy and test each container family.
- [ ] **Read-only versus disabled.** Verify separateReadonlyFromDisabled across
  controls and cells, including mutation guards. The core option being typed
  does not establish consistent adapter presentation.
- [ ] **Config precedence and compound defaults.** Audit remaining namespace,
  restrict and option-bag merging differences. Base lodash merging can merge
  arrays by index; Monaco/grid option bags have different replacement semantics.
  Use the spec's config-consumption inventory to target individual settings.
- [ ] **Interpolation/markup beyond Label.** Label interpolation is implemented
  with CEL. Other text-bearing elements and control descriptions still need an
  explicit contract, integration and translation-order coverage. Do not restart
  the obsolete ICU implementation proposal.
- [ ] **Pending analysis and submit policy.** Complete stale-result handling and
  host submit integration without replacing the existing owner-based
  additional-error store.
- [ ] **File error publication.** Verify read/conversion failures reach host
  validity through the appropriate error integration, including cleanup. Local
  feedback alone does not establish additional-error publication.
- [ ] **Structured diagnostics.** Make stable codes and reporting consistent.
  Template/Slot name lookup and examples exist, but missing-name/duplicate-name
  diagnostics and cyclic named-template expansion guards remain open.
- [ ] **Collection parity.** Pagination and row-detail implementations and tests
  exist in Antd and shadcn. Verify remaining native interaction, keyboard and
  narrow-layout cases and other renderer families; do not list them as wholly
  unimplemented.

Evidence: shared errorSummary.tsx, validationIndicator.ts, rowDetail.tsx and
collectionPagination.ts; Antd util/cellMode.tsx; both ObjectRenderer and
MixedRenderer implementations; tests requiredAsterisk.test.tsx,
containerValidationRender.test.tsx, containerValidationIndicator.test.tsx,
collectionExamples.test.tsx, arrayDetailModes.test.tsx and editorDetailModes.test.tsx.
Paths are under the corresponding packages in this repository.

## Upstream-dependent workarounds

- [ ] **Tuple tester scope resolution.** The sibling core source still restricts
  schemaMatches/schemaSubPathMatches scope resolution to object schemas.
  Antd TupleControlRenderer retains the documented re-rooting workaround.
  Remove it only after the installed core version contains the fix and tuple
  scoped-control regressions pass. Old full-suite counts are not current evidence.
- [ ] **Root schema inference.** demo-common/src/app/demoSchema.ts wraps data for
  core inference. Its TODO tracks JSON Forms PR #2478. After upgrading to a
  released version containing the fix, test absent data, null, scalar/array roots
  and regeneration, then remove the adapter and App.tsx override. Keep Monaco's
  independent stale-schema cleanup. No claim about the PR's current merge status
  is made by this source review.

## Open designs

- [ ] **Dynamic UI-element overlays and remote choices.** Neither is an
  implemented authoring contract. Revisit placement above tester dispatch,
  stable UI-schema identity, typed values, trust boundaries, lifecycle and remote
  cancellation before publishing option shapes. The old claim that the shape
  was already agreed is superseded by the spec's design backlog. Label dynamic
  interpolation remains a separate implemented capability.
- [ ] **Composite-dialog Remove footer action.** Decide whether to implement
  showRemoveButton/removeLabel with ownership and confirmation guards or retire
  the proposal. Existing cell removal is separate; removed schema options should
  not be reintroduced until implemented.
- [ ] **Separate showClearButton option.** Decide whether it adds anything to
  clearable; no new option should be published without a consumer.
- [ ] **Graphical editor.** Implement the authoring workflow described in the
  spec, including drag/drop, branch preview and lossless round trips. Current
  conditionalFields support is runtime field discovery, not a graphical editor.

See the [spec backlog](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/todo.md)
for portable design decisions and promotion criteria.

## Test infrastructure and housekeeping

- [ ] Confirm sustained full-suite stability before closing the historical
  heavy-component watch item. Earlier fixes added shared ResizeObserver/act
  setup, asserted intended promise rejection, and used wall-clock flush budgets.
  These are implemented mitigations, not three outstanding fixes. On recurrence,
  inspect exit status and unhandled Errors as well as test assertions.
- [ ] Re-run lint to establish the current baseline before removing redundant
  per-file observer stubs or other test scaffolding. The old count of 11 lint
  errors was a historical observation and is no longer presented as current.

## Completed items removed from the backlog

- Object errors now use shared error summaries and native object/group feedback
  in Antd and shadcn; the blanket “object errors are never displayed” defect is
  obsolete. The default inline-error fixture remains open above; this
  implementation alone does not close its absence assertions.
- Required-asterisk visibility is implemented; the accessibility follow-up above
  is narrower than the old unimplemented-option entry.
- Mixed type-specific details and generalized detail resolution are implemented,
  with schemas, authoring types, examples and tests. They are no longer proposed
  options awaiting a consumer.
- Conditional object discovery is implemented for its documented opt-in slice.
- Label CEL interpolation, layout sizing, template evaluation gates, template
  URL checks and extended AJV integration are implemented. Old design narratives
  are not active tasks. Ractive's post-write URL check remains an acknowledged
  limitation; it can follow a resource request beginning.
- The Antd object registry-cycle regression has a guard and test. This does not
  close the separate named Template recursion gap listed above.

## Draft-07 visual support follow-up

These are remaining visual behavior and coverage tasks, not claims that the
validator lacks the keywords. Conditional object discovery is already available
through `conditionalFields`; extend it rather than introduce another switch.

- [ ] Strengthen conditional/composition coverage: conditions within anyOf/oneOf,
  referenced branches, named Template/Slot placement, nested identifier scopes,
  and recursive combinations. Preserve authored positions and inactive data.
- [ ] Add contains feedback identifying matching array items and explaining
  missing matches. Existing collection-action checks are only partial coverage.
- [ ] Explain not failures as forbidden combinations. Do not generate positive
  fields from the negated schema. A graphical condition builder is future work.
- [ ] Handle boolean schema false according to the agreed presentation policy:
  - Absent optional forbidden property: show no editor and exclude it from Add
    property choices. Do not show a warning merely because the schema forbids it.
  - Existing forbidden value: expose the validation problem and a removal path,
    respecting read-only state and collection/tuple removal semantics. Do not
    silently hide invalid data or delete it automatically.
  - Root false schema, or a required property with a false schema: explain that
    no valid document is possible; removal is not a solution to requiredness.
  - Graphical schema editor: keep the prohibition inspectable and editable even
    when the runtime form hides the absent field.
  - Test explicit and generated controls, existing/absent values, root values,
    required properties, array positions and read-only forms in both renderers.
- [ ] Define consistent explicit Use default / Use example actions; retain
  existing creation defaults without implying universal initialization.
- [ ] Define writeOnly presentation for summaries, tree labels and previews.
  Password widgets alone do not define this policy or secure stored data.
- [ ] Audit external registered references and nested $id resolution before
  claiming general reference coverage; remote fetching remains a host concern.
- [ ] Assess additional format/content editors where they improve editing;
  ordinary validation does not require a dedicated widget for every keyword.

For graphical authoring, plan constraint panels, reference selection and lossless
preservation of unsupported keywords. Keep editor-only preview/selection state
separate from runtime data. See the spec's
[conditional authoring guidance](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/conditional-fields.md)
and [Draft-07 audit](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/draft-07-visual-support.md).
