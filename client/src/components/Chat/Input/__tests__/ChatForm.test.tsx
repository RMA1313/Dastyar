import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatForm from '../ChatForm';
import { useChatFormContext } from '~/Providers';
import { useRecoilState, useRecoilValue } from 'recoil';

jest.mock('recoil', () => ({
  useRecoilState: jest.fn(),
  useRecoilValue: jest.fn(),
}));

jest.mock('~/Providers', () => ({
  useChatContext: () => ({
    files: [],
    setFiles: jest.fn(),
    conversation: { endpointType: 'openai', conversationId: 'c1', messages: [] },
    isSubmitting: false,
    filesLoading: false,
    newConversation: jest.fn(),
    handleStopGenerating: jest.fn(),
  }),
  useAddedChatContext: () => ({
    addedIndex: 1,
    generateConversation: jest.fn(),
    conversation: null,
    setConversation: jest.fn(),
    isSubmitting: false,
  }),
  useAssistantsMapContext: () => ({}),
  useChatFormContext: jest.fn(),
}));

jest.mock('~/store', () => ({
  speechToText: { key: 'speechToText' },
  textToSpeech: { key: 'textToSpeech' },
  chatDirection: { key: 'chatDirection' },
  automaticPlayback: { key: 'automaticPlayback' },
  maximizeChatSpace: { key: 'maximizeChatSpace' },
  centerFormOnLanding: { key: 'centerFormOnLanding' },
  isTemporary: { key: 'isTemporary' },
  chatBadges: { key: 'chatBadges' },
  isEditingBadges: { key: 'isEditingBadges' },
  showStopButtonByIndex: () => ({ key: 'showStopButtonByIndex' }),
  showPlusPopoverFamily: () => ({ key: 'showPlusPopoverFamily' }),
  showMentionPopoverFamily: () => ({ key: 'showMentionPopoverFamily' }),
}));

jest.mock('~/hooks', () => ({
  useTextarea: () => ({
    isNotAppendable: false,
    handlePaste: jest.fn(),
    handleKeyDown: jest.fn(),
    handleCompositionStart: jest.fn(),
    handleCompositionEnd: jest.fn(),
  }),
  useRequiresKey: () => ({ requiresKey: false }),
  useHandleKeyUp: () => jest.fn(),
  useAutoSave: jest.fn(),
  useLocalize: () => (key: string) => key,
  useSubmitMessage: () => ({
    submitMessage: jest.fn(),
    submitPrompt: jest.fn(),
  }),
  useFocusChatEffect: jest.fn(),
  useQueryParams: jest.fn(),
}));

jest.mock('react-hook-form', () => ({
  useWatch: () => '',
}));

jest.mock('@librechat/client', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactMock = require('react');
  return {
    TextareaAutosize: ReactMock.forwardRef<
      HTMLTextAreaElement,
      React.TextareaHTMLAttributes<HTMLTextAreaElement>
    >((props, ref) => <textarea ref={ref} {...props} />),
  };
});

jest.mock('../Files/AttachFileChat', () => () => <div data-testid="attach-file-chat" />);
jest.mock('../Files/FileFormChat', () => () => <div data-testid="file-form-chat" />);
jest.mock('../TextareaHeader', () => () => <div data-testid="textarea-header" />);
jest.mock('../PromptsCommand', () => () => <div data-testid="prompts-command" />);
jest.mock('../AudioRecorder', () => () => <div data-testid="audio-recorder" />);
jest.mock('../CollapseChat', () => () => <div data-testid="collapse-chat" />);
jest.mock('../StreamAudio', () => () => <div data-testid="stream-audio" />);
jest.mock('../StopButton', () => () => <button data-testid="stop-button">Stop</button>);
jest.mock('../SendButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactMock = require('react');
  return ReactMock.forwardRef<HTMLButtonElement>((props, ref) => (
    <button ref={ref} data-testid="send-button" {...props}>
      Send
    </button>
  ));
});
jest.mock('../EditBadges', () => () => <div data-testid="edit-badges" />);
jest.mock('../BadgeRow', () => () => <div data-testid="badge-row" />);
jest.mock('../Mention', () => () => <div data-testid="mention-popover" />);

describe('ChatForm layout', () => {
  beforeEach(() => {
    (useRecoilState as jest.Mock).mockImplementation((selector: { key?: string }) => {
      if (selector?.key?.includes('chatBadges')) {
        return [[], jest.fn()];
      }
      return [false, jest.fn()];
    });

    (useRecoilValue as jest.Mock).mockImplementation((selector: { key?: string }) => {
      if (selector?.key?.includes('chatDirection')) {
        return 'ltr';
      }
      return false;
    });

    (useChatFormContext as jest.Mock).mockReturnValue({
      register: () => ({ ref: jest.fn() }),
      control: {},
      handleSubmit: (fn: () => void) => fn,
      setValue: jest.fn(),
    });
  });

  it('stretches the input form to the full chat width', () => {
    render(<ChatForm index={0} />);

    const form = screen.getByTestId('chat-input-form');
    expect(form).toHaveClass('w-full', 'max-w-full');
  });
});
