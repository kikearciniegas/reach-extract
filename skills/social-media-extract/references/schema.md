# Normalized record schema

Every extraction writes `record.json` with this top-level shape:

```json
{
  "schema_version": "0.1.0",
  "run_id": "2026-09-22T12-00-00-000Z",
  "source": { "platform": "youtube", "url": "https://..." },
  "content": {
    "title": [],
    "text": [],
    "comments": [],
    "transcript": [],
    "authors": [],
    "media": [],
    "metrics": {}
  },
  "evidence": [],
  "gaps": [],
  "provenance": { "manifest": "manifest.json", "raw_dir": "raw" }
}
```

`evidence` entries contain `kind`, `value`, `source_step`, and `source_path`.
Values are deduplicated without discarding their raw source. The normalizer is
deliberately permissive because OpenCLI adapters do not share a universal
schema.

`gaps` describes requested evidence kinds that were not found. Consumers must
distinguish a gap from an empty claim: no transcript evidence means “not
captured,” not “the video contains no speech.”

Raw command output is authoritative provenance. Normalized fields are an index
over that evidence and may evolve between schema versions.

## Instruction schema

When `--instructions` is used, `instructions.json` contains:

```json
{
  "schema_version": "0.1.0",
  "source": { "platform": "youtube", "url": "https://..." },
  "basis": "transcript",
  "language": "es",
  "gaps": [],
  "steps": [],
  "prerequisites": [],
  "warnings": [],
  "commands": [],
  "stats": { "transcript_segments": 0, "candidates": 0 }
}
```

Each extracted item includes the verbatim transcript fragment, category,
confidence, source step/path, and timestamps when the adapter provided them.
This is an evidence index, not permission to execute the extracted instruction.
`language` is `en`, `es`, `zh`, `pt`, `fr`, `unknown`, or `null` without a
transcript. Only `en`, `es`, and `zh` have cue lexicons; for any other language
`gaps` contains `instructions: unsupported-language` (also copied to
`record.json.gaps`), and zero candidates must be reported as "not checked".
