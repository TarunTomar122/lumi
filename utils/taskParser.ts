import { DateTime } from 'luxon';
import * as chrono from 'chrono-node';

export interface ParsedTaskData {
  title: string;
  due_date?: string;
  reminder_date?: string;
  status: 'todo';
  created_at: string;
}

export function parseTaskInput(userInput: string): ParsedTaskData {
  const now = DateTime.now().setZone('Asia/Kolkata');
  
  // Use chrono to parse natural language dates/times
  const parseResults = chrono.parse(userInput, now.toJSDate(), {
    forwardDate: true // Always assume future dates
  });

  let taskData: ParsedTaskData = {
    title: userInput.trim(), // Default title is the full input
    status: 'todo',
    created_at: new Date().toISOString(),
  };

  if (parseResults.length > 0) {
    const result = parseResults[0];
    
    // Extract the task title by removing the parsed date/time text
    const beforeDateText = userInput.substring(0, result.index).trim();
    const afterDateText = userInput.substring(result.index + result.text.length).trim();
    
    // Combine the parts, removing common connecting words
    let title = (beforeDateText + ' ' + afterDateText).trim();
    title = title.replace(/\s+/g, ' '); // Clean up multiple spaces
    title = title.replace(/^(at|on|by|for)\s+/i, ''); // Remove leading prepositions
    title = title.replace(/\s+(at|on|by|for)$/i, ''); // Remove trailing prepositions
    
    if (title) {
      taskData.title = title;
    }

    // Get the parsed date
    const parsedDate = result.start.date();
    const luxonDate = DateTime.fromJSDate(parsedDate).setZone('Asia/Kolkata');
    
    const isoDate = luxonDate.toISO();
    if (isoDate) {
      taskData.due_date = isoDate;
      taskData.reminder_date = isoDate;
    }
  } else {
    // No date/time found - use smart default logic
    // If it's before 9pm, schedule for today at 9pm
    // If it's 9pm or later, schedule for tomorrow at 9pm
    let targetDateTime = now.set({
      hour: 21, // 9pm in 24-hour format
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    // If it's already past 9pm today, schedule for tomorrow at 9pm
    if (now.hour >= 21) {
      targetDateTime = targetDateTime.plus({ days: 1 });
    }

    const isoDate = targetDateTime.toISO();
    if (isoDate) {
      taskData.due_date = isoDate;
      taskData.reminder_date = isoDate;
    }
  }

  return taskData;
} 