import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RepoAlertTitle from '~/components/Atoms/RepoAlertTitle.vue';

// Mock the github utility
vi.mock('~/utils/github', () => ({
  getRepositoryUrl: vi.fn((owner, repo) => `https://github.com/${owner}/${repo}`),
}));

describe('RepoAlertTitle', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(RepoAlertTitle);

      expect(wrapper.find('.repo-alert-title-container').exists()).toBe(true);
      expect(wrapper.find('h2').exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Alerts for ');
    });

    it('renders with custom props', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
          repo: 'test-repo',
          title: 'Custom Title',
          fallbackText: 'Custom Fallback',
          id: 'custom-id',
          customClass: 'custom-class',
        },
      });

      expect(wrapper.find('.repo-alert-title-container').exists()).toBe(true);
      expect(wrapper.find('h2').exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Custom Title');
    });
  });

  describe('repository link', () => {
    it('renders repository link when owner and repo are provided', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
          repo: 'test-repo',
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('https://github.com/test-owner/test-repo');
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
      expect(link.attributes('aria-label')).toBe('View test-owner/test-repo on GitHub');
      expect(link.text()).toBe('test-owner/test-repo');
    });

    it('does not render repository link when owner is missing', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          repo: 'test-repo',
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(false);
    });

    it('does not render repository link when repo is missing', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(false);
    });

    it('does not render repository link when both owner and repo are missing', () => {
      const wrapper = mount(RepoAlertTitle);

      const link = wrapper.find('a');
      expect(link.exists()).toBe(false);
    });
  });

  describe('fallback text', () => {
    it('shows fallback text when repository link is not rendered', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          fallbackText: 'Custom Fallback Text',
        },
      });

      const fallbackSpan = wrapper.find('span.text-gray-400');
      expect(fallbackSpan.exists()).toBe(true);
      expect(fallbackSpan.text()).toBe('Custom Fallback Text');
    });

    it('shows default fallback text when not provided', () => {
      const wrapper = mount(RepoAlertTitle);

      const fallbackSpan = wrapper.find('span.text-gray-400');
      expect(fallbackSpan.exists()).toBe(true);
      expect(fallbackSpan.text()).toBe('Repository not specified');
    });

    it('does not show fallback text when repository link is rendered', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
          repo: 'test-repo',
        },
      });

      const fallbackSpan = wrapper.find('span.text-gray-400');
      expect(fallbackSpan.exists()).toBe(false);
    });
  });

  describe('title text', () => {
    it('shows custom title when provided', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          title: 'Custom Title',
        },
      });

      const h2 = wrapper.find('h2');
      expect(h2.text()).toContain('Custom Title');
    });

    it('shows default title when not provided', () => {
      const wrapper = mount(RepoAlertTitle);

      const h2 = wrapper.find('h2');
      expect(h2.text()).toContain('Alerts for ');
    });
  });

  describe('id attribute', () => {
    it('sets id attribute when provided', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          id: 'custom-id',
        },
      });

      const h2 = wrapper.find('h2');
      expect(h2.attributes('id')).toBe('custom-id');
    });

    it('does not set id attribute when not provided', () => {
      const wrapper = mount(RepoAlertTitle);

      const h2 = wrapper.find('h2');
      expect(h2.attributes('id')).toBe('');
    });
  });

  describe('custom class', () => {
    it('applies custom class to h2 element', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          customClass: 'custom-class',
        },
      });

      const h2 = wrapper.find('h2');
      expect(h2.classes()).toContain('custom-class');
    });

    it('applies default classes along with custom class', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          customClass: 'custom-class',
        },
      });

      const h2 = wrapper.find('h2');
      expect(h2.classes()).toContain('text-2xl');
      expect(h2.classes()).toContain('font-semibold');
      expect(h2.classes()).toContain('text-white');
      expect(h2.classes()).toContain('custom-class');
    });
  });

  describe('slots', () => {
    it('renders recheck slot when provided', () => {
      const wrapper = mount(RepoAlertTitle, {
        slots: {
          recheck: '<div class="recheck-content">ReCheck Button</div>',
        },
      });

      expect(wrapper.find('.recheck-inline').exists()).toBe(true);
      expect(wrapper.find('.recheck-content').exists()).toBe(true);
      expect(wrapper.find('.recheck-content').text()).toBe('ReCheck Button');
    });

    it('does not render recheck slot when not provided', () => {
      const wrapper = mount(RepoAlertTitle);

      expect(wrapper.find('.recheck-inline').exists()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('provides proper aria-label for repository link', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
          repo: 'test-repo',
        },
      });

      const link = wrapper.find('a');
      expect(link.attributes('aria-label')).toBe('View test-owner/test-repo on GitHub');
    });

    it('opens repository link in new tab with proper security attributes', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
          repo: 'test-repo',
        },
      });

      const link = wrapper.find('a');
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });
  });

  describe('styling', () => {
    it('applies correct CSS classes to container', () => {
      const wrapper = mount(RepoAlertTitle);

      const container = wrapper.find('.repo-alert-title-container');
      expect(container.classes()).toContain('repo-alert-title-container');
    });

    it('applies correct CSS classes to h2 element', () => {
      const wrapper = mount(RepoAlertTitle);

      const h2 = wrapper.find('h2');
      expect(h2.classes()).toContain('text-2xl');
      expect(h2.classes()).toContain('font-semibold');
      expect(h2.classes()).toContain('text-white');
    });

    it('applies correct CSS classes to repository link', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: 'test-owner',
          repo: 'test-repo',
        },
      });

      const link = wrapper.find('a');
      expect(link.classes()).toContain('text-white');
      expect(link.classes()).toContain('underline');
      expect(link.classes()).toContain('hover:text-blue-400');
      expect(link.classes()).toContain('transition-colors');
    });

    it('applies correct CSS classes to fallback text', () => {
      const wrapper = mount(RepoAlertTitle);

      const fallbackSpan = wrapper.find('span.text-gray-400');
      expect(fallbackSpan.classes()).toContain('text-gray-400');
    });
  });

  describe('edge cases', () => {
    it('handles empty owner and repo strings', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: '',
          repo: '',
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(false);
    });

    it('handles null owner and repo values', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: null,
          repo: null,
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(false);
    });

    it('handles undefined owner and repo values', () => {
      const wrapper = mount(RepoAlertTitle, {
        props: {
          owner: undefined,
          repo: undefined,
        },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(false);
    });
  });
});
