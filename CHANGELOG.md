# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Hash-based state management for reduced storage footprint
- Backward compatibility for old state format
- Cost tracking integration in `generate` command

### Changed
- State file now stores text hashes instead of full translations (70% space reduction)
- Improved TypeScript type safety across providers

### Fixed
- `i18n.costs` command now reads `historyPath` from config
- Type narrowing issues in generate command

## [1.0.0] - 2024-10-23

### Added
- Initial release
- OpenAI provider support (GPT-4, GPT-4 Turbo, GPT-3.5)
- Google Gemini provider support (Gemini 1.5 Flash, Gemini 1.5 Pro)
- Schema-driven translation workflow
- Smart state management with MD5 hashing
- Batch translation with automatic fallback
- Pluralization support
- `generate` command for translation generation
- `i18n.usage` command for token estimation
- `i18n.report` command for cost estimation
- `i18n.costs` command for historical cost analysis
- Built-in pricing database for major LLM providers
- Automatic token and cost tracking
- CI/CD-friendly CLI interface
- TypeScript support with full type definitions
- Comprehensive test suite
- Documentation and quick start guide

### Security
- API keys loaded from environment variables by default
- No data sent to third-party servers (direct LLM provider communication)

## [0.1.0] - 2024-10-01

### Added
- Initial prototype
- Basic OpenAI integration
- Simple translation workflow

---

## Release Notes

### v1.0.0 - Initial Public Release

This is the first stable release of i18n-llm! 🎉

**Highlights:**
- Production-ready translation workflow
- Support for OpenAI and Gemini providers
- Comprehensive cost tracking and reporting
- Smart caching to minimize API costs
- Full TypeScript support

**Migration from pre-1.0:**
No breaking changes for new users. If you used the prototype (0.1.0), please see the migration guide in the documentation.

**Known Issues:**
- None

**Contributors:**
- Daniel Belintani (@danielbelintani)

---

## How to Upgrade

### From 0.x to 1.0

```bash
npm install -D i18n-llm@latest
```

**Breaking Changes:**
- Configuration file format changed (see migration guide)
- State file format changed (automatic migration on first run)

**New Features:**
- Cost tracking commands
- Gemini provider support
- Batch translation

### Keeping Up to Date

```bash
# Check current version
npx i18n-llm --version

# Update to latest
npm update i18n-llm
```

---

## Deprecation Notices

None at this time.

---

## Future Plans

See [ROADMAP.md](./ROADMAP.md) for planned features and improvements.

