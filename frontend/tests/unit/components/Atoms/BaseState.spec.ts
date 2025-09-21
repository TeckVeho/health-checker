import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseState from '@/components/atoms/states/BaseState.vue';

// Mock the BaseButton component
vi.mock('@/components/atoms/buttons/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')"><slot>{{ text }}</slot></button>',
    props: ['text', 'variant', 'icon'],
    emits: ['click'],
  },
}));

// Mock the BaseTag component
vi.mock('@/components/atoms/tags/BaseTag.vue', () => ({
  default: {
    name: 'BaseTag',
    template: '<span class="base-tag"><slot>{{ value }}</slot></span>',
    props: ['value', 'healthStatus', 'size'],
  },
}));

describe('BaseState', () => {
  it('renders with basic props', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'empty',
        title: 'Test Title',
        description: 'Test Description',
      },
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Test Description');
    expect(wrapper.classes()).toContain('base-state');
    expect(wrapper.classes()).toContain('base-state--empty');
  });

  it('renders with different types', () => {
    const types = ['empty', 'loading', 'error', 'success', 'info', 'recheck'];
    
    types.forEach(type => {
      const wrapper = mount(BaseState, {
        props: {
          type: type as any,
          title: 'Test Title',
        },
      });

      expect(wrapper.classes()).toContain(`base-state--${type}`);
    });
  });

  it('renders with icon', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'info',
        title: 'Test Title',
        icon: 'pi pi-info-circle',
      },
    });

    const icon = wrapper.find('i');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('pi', 'pi-info-circle');
  });

  it('renders computed icon when no icon provided', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'loading',
        title: 'Test Title',
      },
    });

    const icon = wrapper.find('i');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('pi-spin', 'pi-spinner');
  });

  it('renders error state with error message', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'error',
        title: 'Error Title',
        error: 'Something went wrong',
      },
    });

    expect(wrapper.text()).toContain('Something went wrong');
    expect(wrapper.find('.state-error').exists()).toBe(true);
  });

  it('renders with action button', () => {
    const actionHandler = vi.fn();
    const wrapper = mount(BaseState, {
      props: {
        type: 'empty',
        title: 'Test Title',
        action: {
          label: 'Test Action',
          handler: actionHandler,
          variant: 'primary',
        },
      },
    });

    const button = wrapper.findComponent({ name: 'BaseButton' });
    expect(button.exists()).toBe(true);
    expect(button.props('text')).toBe('Test Action');
    expect(button.props('variant')).toBe('primary');
  });

  it('calls action handler when button is clicked', async () => {
    const actionHandler = vi.fn();
    const wrapper = mount(BaseState, {
      props: {
        type: 'empty',
        title: 'Test Title',
        action: {
          label: 'Test Action',
          handler: actionHandler,
        },
      },
    });

    const button = wrapper.findComponent({ name: 'BaseButton' });
    await button.trigger('click');
    expect(actionHandler).toHaveBeenCalled();
  });

  it('renders retry button for error state', async () => {
    const retryHandler = vi.fn();
    const wrapper = mount(BaseState, {
      props: {
        type: 'error',
        title: 'Error Title',
        error: 'Something went wrong',
        retry: retryHandler,
      },
    });

    const retryButton = wrapper.findComponent({ name: 'BaseButton' });
    expect(retryButton.exists()).toBe(true);
    expect(retryButton.props('text')).toBe('Retry');
    expect(retryButton.props('icon')).toBe('pi pi-refresh');
  });

  it('calls retry handler when retry button is clicked', async () => {
    const retryHandler = vi.fn();
    const wrapper = mount(BaseState, {
      props: {
        type: 'error',
        title: 'Error Title',
        retry: retryHandler,
      },
    });

    const retryButton = wrapper.findComponent({ name: 'BaseButton' });
    await retryButton.trigger('click');
    expect(retryHandler).toHaveBeenCalled();
  });

  it('renders recheck status', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'recheck',
        title: 'Recheck Status',
        recheckStatus: 'running',
      },
    });

    expect(wrapper.find('.state-recheck').exists()).toBe(true);
    expect(wrapper.find('.recheck-status-row').exists()).toBe(true);
  });

  it('renders recheck history', () => {
    const recheckHistory = [
      { timestamp: '2023-01-01T00:00:00Z', status: 'completed' },
      { timestamp: '2023-01-02T00:00:00Z', status: 'failed' },
    ];

    const wrapper = mount(BaseState, {
      props: {
        type: 'recheck',
        title: 'Recheck Status',
        recheckHistory,
      },
    });

    // Check if recheck history section exists
    expect(wrapper.find('.recheck-history').exists()).toBe(true);
    expect(wrapper.find('.recheck-history-list').exists()).toBe(true);
  });

  it('renders with custom class', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'empty',
        title: 'Test Title',
        customClass: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
  });

  it('renders with custom style', () => {
    const customStyle = { backgroundColor: 'red' };
    const wrapper = mount(BaseState, {
      props: {
        type: 'empty',
        title: 'Test Title',
        customStyle,
      },
    });

    expect(wrapper.attributes('style')).toContain('background-color: red');
  });

  it('renders with slot content', () => {
    const wrapper = mount(BaseState, {
      props: {
        type: 'empty',
        title: 'Test Title',
      },
      slots: {
        default: 'Slot Content',
      },
    });

    expect(wrapper.text()).toContain('Slot Content');
  });

  it('formats time correctly', () => {
    const recheckHistory = [
      { timestamp: '2023-01-01T00:00:00Z', status: 'completed' },
    ];

    const wrapper = mount(BaseState, {
      props: {
        type: 'recheck',
        title: 'Recheck Status',
        recheckHistory,
      },
    });

    // Check if recheck history section exists and contains formatted time
    expect(wrapper.find('.recheck-history').exists()).toBe(true);
    expect(wrapper.text()).toContain('2023');
  });
});
