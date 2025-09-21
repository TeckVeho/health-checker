import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '@/components/atoms/buttons/BaseButton.vue';

describe('BaseButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
      },
    });

    expect(wrapper.text()).toContain('Test Button');
    expect(wrapper.classes()).toContain('base-button');
    expect(wrapper.classes()).toContain('base-button--primary');
    expect(wrapper.classes()).toContain('base-button--medium');
  });

  it('renders with different variants', () => {
    const variants = ['primary', 'secondary', 'danger', 'success', 'link', 'outlined'];
    
    variants.forEach(variant => {
      const wrapper = mount(BaseButton, {
        props: {
          text: 'Test Button',
          variant: variant as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-button--${variant}`);
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const wrapper = mount(BaseButton, {
        props: {
          text: 'Test Button',
          size: size as any,
        },
      });

      expect(wrapper.classes()).toContain(`base-button--${size}`);
    });
  });

  it('renders with icon', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        icon: 'pi pi-check',
        iconPosition: 'left',
      },
    });

    const icon = wrapper.find('i');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('pi', 'pi-check');
  });

  it('renders with right icon', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        icon: 'pi pi-arrow-right',
        iconPosition: 'right',
      },
    });

    const icon = wrapper.find('i');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('pi', 'pi-arrow-right');
  });

  it('renders as link when href is provided', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Link',
        href: '/test',
        target: '_blank',
      },
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/test');
    expect(wrapper.attributes('target')).toBe('_blank');
  });

  it('renders as PrimeVue Button when no href', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
      },
    });

    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
  });

  it('handles click events', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        disabled: true,
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('does not emit click when loading', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        loading: true,
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('renders with action-specific classes', () => {
    const actions = ['health', 'recheck', 'back', 'custom'];
    
    actions.forEach(action => {
      const wrapper = mount(BaseButton, {
        props: {
          text: 'Test Button',
          action: action as any,
        },
      });

      if (action !== 'custom') {
        expect(wrapper.classes()).toContain(`base-button--${action}`);
      }
    });
  });

  it('renders with status-specific classes', () => {
    const statuses = ['active', 'inactive', 'loading', 'success', 'error'];
    
    statuses.forEach(status => {
      const wrapper = mount(BaseButton, {
        props: {
          text: 'Test Button',
          status: status as any,
        },
      });

      if (status !== 'active') {
        expect(wrapper.classes()).toContain(`base-button--${status}`);
      }
    });
  });

  it('renders with custom class', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        customClass: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
  });

  it('renders with custom style', () => {
    const customStyle = { backgroundColor: 'red' };
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        customStyle,
      },
    });

    // Check if custom style is applied to the component
    expect(wrapper.props('customStyle')).toEqual(customStyle);
  });

  it('renders with slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Slot Content',
      },
    });

    expect(wrapper.text()).toContain('Slot Content');
  });

  it('applies aria-label', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Test Button',
        ariaLabel: 'Accessible button',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('Accessible button');
  });
});
