import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import InfoContainer, { InfoMessageProps } from './InfoContainer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: any[];
}

interface MessageProps {
  message: Message;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const [messageContent, setMessageContent] = useState<string>(message.content);
  const [infoMessage, setInfoMessage] = useState<InfoMessageProps>({items: []});

  useEffect(() => {
    try {
      const contentStr = message.content;
      if (contentStr.includes('"display_message"')) {
        const match = contentStr.match(/\{[\s\S]*"display_message"[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.display_message) {
            setInfoMessage(parsed.display_message);
            // Remove the display_message object from the content
            setMessageContent(contentStr.replace(match[0], '').trim());
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse display_message:', e);
    }
  }, [message]);
  return (
    <View>
      <Text style={message.role === 'user' ? styles.userResponse : styles.assistantResponse}>
        {messageContent}
      </Text>
      {infoMessage.items.length > 0 && <InfoContainer items={infoMessage.items} />}
    </View>
  );
};

const styles = StyleSheet.create({
  userResponse: {
    color: '#F5F5F5',
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'MonaSans-Regular',
    backgroundColor: '#3B3B3B',
    padding: 16,
    marginLeft: 52,
    paddingRight: 0,
    borderRadius: 16,
    marginBottom: 16,
  },
  assistantResponse: {
    color: '#F5F5F5',
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'MonaSans-Regular',
    backgroundColor: 'rgba(145, 145, 145, 0.5)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
});
export default Message;
