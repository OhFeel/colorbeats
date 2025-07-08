# Contributing to ColorBeats

Thank you for your interest in contributing to ColorBeats! We're excited to have you as part of our community. This document outlines the process for contributing to the project.

## 🎯 Ways to Contribute

- 🐛 **Report bugs** - Help us identify and fix issues
- 💡 **Suggest features** - Share ideas for new functionality
- 📝 **Improve documentation** - Help make our docs clearer
- 🧪 **Write tests** - Help us build a robust testing suite
- 🎨 **Design improvements** - Enhance the UI/UX
- 💻 **Code contributions** - Fix bugs or implement features

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/colorbeats.git
cd colorbeats
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Spotify credentials

# Start development server
npm run dev
```

### 3. Create a Branch

```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/issue-description
```

## 📝 Development Guidelines

### Code Style

We use Prettier and ESLint to maintain consistent code style:

```bash
# Check linting
npm run lint

# Format code
npm run format # (if you add this script)
```

### TypeScript

- Maintain strict type safety
- Add proper type annotations for new functions
- Avoid using `any` type unless absolutely necessary

### Component Guidelines

- Keep components small and focused on a single responsibility
- Use descriptive prop interfaces
- Include JSDoc comments for complex functions
- Follow the existing file structure patterns

### Commit Messages

Use conventional commit format:

```
type(scope): description

Examples:
feat(playlist): add color sorting algorithm
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
style(ui): improve button hover states
```

## 🧪 Testing

Currently, we don't have a comprehensive testing suite set up. This is a great area for contribution! If you'd like to help:

- Set up Jest and Testing Library
- Write unit tests for utility functions
- Add integration tests for key user flows
- Create E2E tests with Playwright or Cypress

## 🎨 Design Guidelines

### UI/UX Principles

- **Accessibility First**: Ensure features work with screen readers and keyboard navigation
- **Mobile Responsive**: Test on various screen sizes
- **Performance**: Keep interactions smooth and loading times minimal
- **Spotify Design Language**: Maintain consistency with Spotify's design patterns where appropriate

### Color Considerations

Since this app is about colors:
- Ensure sufficient color contrast for accessibility
- Test with color blindness simulators
- Provide alternative indicators beyond color alone

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment**: OS, browser, Node.js version
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Console errors**: Any error messages

Use this template:

```markdown
## Bug Description
Brief description of the issue

## Environment
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari + version]
- Node.js version: [run `node --version`]

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Screenshots
If applicable

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

For feature requests, please include:

1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: Other approaches you've thought of
4. **Use cases**: Who would benefit and how?

## 📋 Pull Request Process

### Before Submitting

- [ ] Code follows the established patterns
- [ ] All existing tests pass
- [ ] New features include appropriate tests
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots
If applicable

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings/errors
```

### Review Process

1. Automated checks must pass (linting, building)
2. At least one maintainer review required
3. Address feedback promptly
4. Keep PR scope focused and manageable

## 🎯 Priority Areas for Contribution

### High Priority
- [ ] **Testing Infrastructure**: Set up Jest/Testing Library
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Performance**: Optimize color extraction for large playlists
- [ ] **Error Handling**: Better user feedback for API errors

### Medium Priority
- [ ] **Mobile UX**: Improve touch interactions
- [ ] **Playlist Management**: Bulk operations, filtering
- [ ] **Color Analytics**: Statistics and visualizations
- [ ] **Audio Preview**: Integrate Spotify's preview API

### Nice to Have
- [ ] **Internationalization**: Multi-language support
- [ ] **Themes**: Dark/light mode improvements
- [ ] **Export Features**: Save color palettes
- [ ] **Social Features**: Share color-sorted playlists

## 📞 Getting Help

- 💬 **Discussions**: For questions and general chat
- 📧 **Discord/Slack**: [Link if you set up a community]
- 📖 **Documentation**: Check existing docs first
- 🐛 **Issues**: Search existing issues before creating new ones

## 🙏 Recognition

Contributors will be:
- Added to the README contributors section
- Mentioned in release notes for significant contributions
- Invited to join the maintainers team for consistent, high-quality contributions

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the existing code patterns
- Celebrate others' contributions

Thank you for contributing to ColorBeats! 🎵🌈
