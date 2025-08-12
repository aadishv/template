import { ChangeEvent, useState, ClipboardEvent, useEffect, useRef } from "react";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getApiKey } from "./getApiKey";
import { convertToModelMessages, FileUIPart, streamText, ToolSet, ToolUIPart } from "ai";
import { toast } from "sonner";
import { useChat as useChatInternal } from "@ai-sdk/react";
import { z } from "zod";
import { InferUITools } from "ai";
const SYSTEM_PROMPT = `## General instructions
Keep interactions short and concise. Use tool calls to express intent as much as possible.
Try to stay on-topic. Entertain the user's whims but try to tie it back to your role -- for example, if the user asks to discuss computers, talk about computers but include Chinese definitions for some of the common words you use.
**Avoid saying you can't do something; make sure to subtly introduce Chinese learning into the conversation.**

## Role
You are a helpful orchestrator for a Chinese learning app. The mental model of the app is as follows:
* the orchestrator (you) generates sentences and organizes these sentences using libraries.
  * Generate sentences yourself based on the user query and previous context.
  * If a library name is not provided, feel free to choose one yourself.
* The orchestrator can also trigger a "practice" with the sentences from a specific set of libraries.
  * Sentences consist of a definition (single string, English) and list of {character, pinyin} objects for each of the words.
  * If the word is punctuation, put the punctuation mark in the character field and leave the pinyin field empty.
  * There should not be more than one period/question mark per sentence.
ALWAYS use Simplified Mandarin Chinese.

## Example flow
1. User asks for a library to be created, or just to practice a certain set of sentences.
2. Orchestrator checks available libraries to see if any match the user's request, or otherwise creates a new one. If creating one, orchestrator also generates practice sentences.
NOTE: for now, editing or deleting libraries is not supported.
3. If requested, orchestrator triggers a practice.

# Notes about tools
* If a user rejects a request to create a library, it will not be created. You can ask them if they would like to try again.
  * If the user provides feedback or an explanation for why they rejected a request, treat its intent as to try again.
* Sentences within a library should all have unique definitions.`;
const MODEL = "gemini-2.5-flash-lite";
const tools = {
  createLibrary: {
    description: "Ask the user to create a library.",
    inputSchema: z.object({
      name: z.string().describe("Name of library. Can include spaces etc."),
      sentences: z
        .array(
          z.object({
            definition: z
              .string()
              .describe("Definition of the sentence in English"),
            words: z.array(
              z.object({
                character: z.string().describe("Chinese character"),
                pinyin: z.string().describe("Pinyin for the character"),
              }),
            ),
          }),
        )
        .describe("The sentences to insert into the library"),
    }),
  },
} satisfies ToolSet;
export type uiTool = ToolUIPart<InferUITools<typeof tools>>;

const useChat = () => {
  // file stuff
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);
  const filesObject = {
    inputOptions: {
      type: "file",
      className: "hidden",
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const incoming = event.target.files ? Array.from(event.target.files) : [];
        if (incoming.length > 0) {
          setFiles(prev => [...prev, ...incoming]);
        }
      },
      accept: "image/*",
      multiple: true,
      ref: fileInputRef
    },
    triggerAddFile: () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    },
    handlePaste: (e: ClipboardEvent<HTMLInputElement>) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const incoming = items
        .map((item) => (item.kind === "file" ? item.getAsFile() : null))
        .filter((f): f is File => !!f && f.type.startsWith("image/"));
      if (incoming.length > 0) {
        e.preventDefault();
        setFiles((prev) => [...prev, ...incoming]);
      }
    },
    previews,
    clearFiles: () => {
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  };
  // scroll
  const inputContainerRef = useRef<HTMLDivElement>(null);
  // chat stuff
  const [prompt, setPrompt] = useState<string>("");

  const chat = useChatInternal({
    transport: {
      sendMessages: async ({ messages }) => {
        const genAI = createGoogleGenerativeAI({
          apiKey: getApiKey() ?? "",
        });
        const result = streamText({
          model: genAI(MODEL),
          messages: convertToModelMessages(messages),
          system: SYSTEM_PROMPT,
          onError: (e) => {
            toast.error(`Error: ${e.error as any}`);
          },
          providerOptions: {
            google: {
              thinkingConfig: {
                thinkingBudget: 8192,
                includeThoughts: true,
              },
            },
          },
          tools,
        });
        return result.toUIMessageStream({ sendReasoning: true });
      },
      reconnectToStream: async (_) => {
        return null;
      },
    },
  });
  const fileToData = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        resolve(typeof result === "string" ? result : "");
      };

      reader.onerror = () => {
        reader.abort(); // Optional: Abort the reading process on error.
        reject(Error("Error occurred"));
      };

      reader.readAsDataURL(file);
    });
  }
  const submit = async () => {
    if (!prompt) return;
    const mappedFiles = await Promise.all(files.map(fileToData));
    setPrompt("");
    setFiles([]);
    void chat.sendMessage({
      text: prompt,
      files: files.map((file, i) => ({
        type: 'file',
        mediaType: file.type,
        filename: file.name,
        url: mappedFiles[i],
      } as FileUIPart)),
    });
  };
  useEffect(
    () => {
      inputContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    },
    [chat.messages.length, chat.status, prompt]
  )

  return {
    submit,
    inputOptions: {
      value: prompt,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrompt(e.target.value);
      },
      onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          void submit();
        }
      },
      placeholder: "prompt",
    },
    messages: chat.messages,
    status: chat.status,
    isLoading: chat.status === "streaming" || chat.status === "submitted",
    addToolResult: chat.addToolResult,
    files: filesObject,
    inputContainerOptions: {
      ref: inputContainerRef,
    }
  } as const;
};

export default useChat;
