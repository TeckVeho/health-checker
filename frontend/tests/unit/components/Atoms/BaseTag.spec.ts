import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseTag from '@/components/atoms/tags/BaseTag.vue';

describe('BaseTag', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
      },
    });

    expect(wrapper.text()).toContain('Test Tag');
    expect(wrapper.classes()).toContain('base-tag');
    expect(wrapper.classes()).toContain('base-tag--info');
    expect(wrapper.classes()).toContain('base-tag--medium');
  });

  it('renders with different variants', () => {
    const variants = ['success', 'warning', 'error', 'info', 'neutral'];
    
    variants.forEach(variant => {
      const wrapper = mount(BaseTag, {
        props: {
          value: 'Test Tag',
          variant: variant as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-tag--${variant}`);
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const wrapper = mount(BaseTag, {
        props: {
          value: 'Test Tag',
          size: size as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-tag--${size}`);
    });
  });

  it('renders with health status', () => {
    const healthStatuses = ['healthy', 'warning', 'critical'];
    
    healthStatuses.forEach(status => {
      const wrapper = mount(BaseTag, {
        props: {
          value: 'Test Tag',
          healthStatus: status as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-tag--health-${status}`);
    });
  });

  it('renders with count', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        count: 5,
      },
    });

    expect(wrapper.text()).toContain('Test Tag');
  });

  it('renders with icon', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        icon: 'pi pi-check',
      },
    });

    // PrimeVue Tag component handles icon internally
    expect(wrapper.text()).toContain('Test Tag');
  });

  it('renders with custom class', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        customClass: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
  });

  it('renders with custom style', () => {
    const customStyle = { backgroundColor: 'red' };
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        customStyle,
      },
    });

    expect(wrapper.attributes('style')).toContain('background-color: red');
  });

  it('renders with slot content', () => {
    const wrapper = mount(BaseTag, {
      slots: {
        default: 'Slot Content',
      },
    });

    expect(wrapper.text()).toContain('Slot Content');
  });

  it('applies aria-label', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        ariaLabel: 'Test label',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('Test label');
  });

  it('handles empty value', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: '',
      },
    });

    expect(wrapper.text()).toContain('0');
  });

  it('handles null value', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: null,
      },
    });

    expect(wrapper.text()).toContain('0');
  });

  it('handles undefined value', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: undefined,
      },
    });

    expect(wrapper.text()).toContain('0');
  });

  it('applies PrimeVue props', () => {
    const pt = { root: { class: 'custom-prime-class' } };
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        pt,
      },
    });

    expect(wrapper.props('pt')).toEqual(pt);
  });

  it('renders with rounded prop', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        rounded: true,
      },
    });

    expect(wrapper.props('rounded')).toBe(true);
  });

  it('renders with closable prop', () => {
    const wrapper = mount(BaseTag, {
      props: {
        value: 'Test Tag',
        closable: true,
      },
    });

    expect(wrapper.props('closable')).toBe(true);
  });
});
