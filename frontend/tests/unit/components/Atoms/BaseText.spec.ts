import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseText from '@/components/atoms/text/BaseText.vue';

// Mock the github utility
vi.mock('~/utils/github', () => ({
  getRepositoryUrl: vi.fn((owner: string, repo: string) => `https://github.com/${owner}/${repo}`),
}));

describe('BaseText', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseText, {
      props: {
        text: 'Test Text',
      },
    });

    // Debug: Check what's actually rendered
    console.log('Rendered HTML:', wrapper.html());
    console.log('Text content:', wrapper.text());
    console.log('Props:', wrapper.props());

    expect(wrapper.text()).toContain('Test Text');
    expect(wrapper.element.tagName).toBe('P');
    expect(wrapper.classes()).toContain('base-text');
    expect(wrapper.classes()).toContain('base-text--body');
  });

  it('renders with different variants', () => {
    const variants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption'];
    
    variants.forEach(variant => {
      const wrapper = mount(BaseText, {
        props: {
          text: 'Test Text',
          variant: variant as any,
        },
      });

      expect(wrapper.element.tagName).toBe(variant.startsWith('h') ? variant.toUpperCase() : 'P');
      expect(wrapper.classes()).toContain(`base-text--${variant}`);
    });
  });

  it('renders with different colors', () => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'muted'];
    
    colors.forEach(color => {
      const wrapper = mount(BaseText, {
        props: {
          text: 'Test Text',
          color: color as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-text--${color}`);
    });
  });

  it('renders with different weights', () => {
    const weights = ['normal', 'medium', 'bold'];
    
    weights.forEach(weight => {
      const wrapper = mount(BaseText, {
        props: {
          text: 'Test Text',
          weight: weight as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-text--${weight}`);
    });
  });

  it('renders with different alignments', () => {
    const alignments = ['left', 'center', 'right'];
    
    alignments.forEach(align => {
      const wrapper = mount(BaseText, {
        props: {
          text: 'Test Text',
          align: align as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-text--${align}`);
    });
  });

  it('renders loading state', () => {
    const wrapper = mount(BaseText, {
      props: {
        loading: true,
        loadingText: 'Loading...',
      },
    });

    expect(wrapper.text()).toContain('Loading...');
    expect(wrapper.find('i.pi-spin').exists()).toBe(true);
    expect(wrapper.classes()).toContain('base-text--loading');
  });

  it('renders health type with count', () => {
    const wrapper = mount(BaseText, {
      props: {
        type: 'health',
        count: 5,
        text: 'Health Status',
      },
    });

    expect(wrapper.text()).toContain('5');
    expect(wrapper.classes()).toContain('base-text--health');
  });

  it('renders repo type with owner and repo', () => {
    const wrapper = mount(BaseText, {
      props: {
        type: 'repo',
        owner: 'test-owner',
        repo: 'test-repo',
        text: 'Repository: ',
      },
    });

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://github.com/test-owner/test-repo');
    expect(link.text()).toBe('test-owner/test-repo');
    expect(wrapper.classes()).toContain('base-text--repo');
  });

  it('renders alert type with count', () => {
    const wrapper = mount(BaseText, {
      props: {
        type: 'alert',
        count: 3,
        text: 'Alerts: ',
      },
    });

    expect(wrapper.text()).toContain('3 alerts');
    expect(wrapper.classes()).toContain('base-text--alert');
  });

  it('renders fallback text when no owner/repo for repo type', () => {
    const wrapper = mount(BaseText, {
      props: {
        type: 'repo',
        fallbackText: 'No repository specified',
      },
    });

    expect(wrapper.text()).toContain('No repository specified');
  });

  it('renders with custom class', () => {
    const wrapper = mount(BaseText, {
      props: {
        text: 'Test Text',
        customClass: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
  });

  it('renders with custom style', () => {
    const customStyle = { color: 'red' };
    const wrapper = mount(BaseText, {
      props: {
        text: 'Test Text',
        customStyle,
      },
    });

    expect(wrapper.attributes('style')).toContain('color: red');
  });

  it('renders with slot content', () => {
    const wrapper = mount(BaseText, {
      slots: {
        default: 'Slot Content',
      },
    });

    expect(wrapper.text()).toContain('Slot Content');
  });

  it('applies accessibility attributes', () => {
    const wrapper = mount(BaseText, {
      props: {
        text: 'Test Text',
        id: 'test-id',
        ariaLevel: 2,
        ariaLabel: 'Test label',
      },
    });

    expect(wrapper.attributes('id')).toBe('test-id');
    expect(wrapper.attributes('aria-level')).toBe('2');
    expect(wrapper.attributes('aria-label')).toBe('Test label');
  });

  it('applies role and aria-live for loading state', () => {
    const wrapper = mount(BaseText, {
      props: {
        loading: true,
      },
    });

    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-live')).toBe('polite');
  });
});
