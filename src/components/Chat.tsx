import useChat, { uiTool } from "@/logic/useChat";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ComponentType, ReactNode, useState } from "react";
import { Input } from "./ui/input";
import { ArrowUp, Plus } from "lucide-react";
import Markdown from "react-markdown";

function ConfirmTool({
  children,
  tool,
  chat,
}: {
  children: ComponentType<{
    input: typeof tool.input;
    bar: ReactNode;
  }>;
  tool: uiTool;
  chat: ReturnType<typeof useChat>;
}) {
  const props = {
    children,
  };
  const [disabled, setDisabled] = useState(false);
  const resolve = (msg: string) => {
    void chat.addToolResult({
      tool: tool.type.split("-")[-1],
      toolCallId: tool.toolCallId,
      output: msg,
    });
    setDisabled(true);
  };
  return (
    <div className="bg-secondary/50 p-4 rounded-xl my-3">
      {tool.state === "input-streaming" ? (
        <Skeleton className="w-full h-10" />
      ) : (
        <div className="flex flex-row">
          <props.children
            input={tool.input}
            bar={
              tool.state === "output-available" ? (
                <Badge className="ml-auto" variant="outline">
                  {tool.output}
                </Badge>
              ) : (
                <>
                  <Button
                    className="ml-auto mr-3"
                    disabled={disabled}
                    onClick={() => resolve("Approved by user")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => resolve("Rejected by user")}
                  >
                    Reject
                  </Button>
                </>
              )
            }
          />
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const chat = useChat();

  return (
    <div className="max-w-[50rem] w-full mx-auto flex flex-col h-[100vh-3.75rem] overflow-y-auto snap-y snap-mandatory">
      <div
        className="flex-1 px-1 snap-start"
      >
        {chat.messages.map((message) => (
          <div
            key={message.id}
            className={`!text-lg ${message.role === "user" ? "bg-primary text-primary-foreground text-center mb-3 rounded-2xl p-4" : ""}`}
          >
            {message.parts.map((part) => {
              if (part?.type == "text") {
                return (
                  <Markdown key={part.state + part.type + part.text}>
                    {part.text}
                  </Markdown>
                );
              } else if (part.type === 'file' && part.mediaType.startsWith('image/')) {
                return <img key={part.url} className="h-20 rounded-xl mx-auto" src={part.url} alt="Generated image" />;
              } else if (part?.type == "reasoning") {
                return (
                  chat.isLoading && (
                    <div className="!text-black/60 font-light">
                      <Markdown key={part.state + part.type + part.text}>
                        {part.text.split("\n")[0]}
                      </Markdown>
                    </div>
                  )
                );
              } else if (part?.type === "tool-createLibrary") {
                return (
                  <ConfirmTool
                    tool={part as uiTool}
                    chat={chat}
                    key={part.toolCallId}
                    children={({ input, bar }) => (
                      <>
                        <div className="flex flex-col gap-4 w-full text-lg">
                          <div className="flex flex-row w-full">
                            <span className="my-auto mr-auto">
                              {"Add library "}
                              <code>{input?.name}</code>
                              {" with sentences:"}
                            </span>
                            <span className="">{bar}</span>
                          </div>
                          <span className="flex flex-wrap gap-4">
                            {input?.sentences &&
                              input.sentences.length > 0 &&
                              input.sentences.map((sentence) => (
                                <div
                                  className="bg-white rounded-2xl text-xl flex flex-col gap-2 p-6 min-w-[16rem] max-w-xs flex-1"
                                  key={sentence?.definition}
                                >
                                  <div className="font-sans">
                                    {sentence?.words
                                      ?.map((w) => w?.character)
                                      .join("")}
                                  </div>
                                  <div className="font-sans text-lg">
                                    {sentence?.words
                                      ?.map((w) =>
                                        w?.pinyin ? w?.pinyin : w?.character,
                                      )
                                      .join(" ")}
                                  </div>
                                  <div className="font-serif text-lg">
                                    {sentence?.definition}
                                  </div>
                                </div>
                              ))}
                          </span>
                        </div>
                      </>
                    )}
                  />
                );
              }
            })}
          </div>
        ))}
        <Skeleton
          className={`w-full h-10 transition-all ${chat.status === "streaming" ? "h-10" : chat.status === "submitted" ? "h-50" : "h-0"}`}
        />
      </div>
      <div className="p-2 snap-end">
      <div className="flex flex-col bg-secondary min-h-15 gap-2.5 p-2.5 rounded-4xl" {...chat.inputContainerOptions}>
        <div className="flex">
          <input {...chat.files.inputOptions} />
          <Button
            className="w-10 h-10"
            onClick={chat.files.triggerAddFile}
            variant="outline"
          >
            <Plus />
          </Button>

          <Input
            className="!border-0 rounded-none !text-2xl placeholder:text-black/50"
            onPaste={chat.files.handlePaste}
            {...chat.inputOptions}
          />
          <Button className="w-10 h-10">
            <ArrowUp />
          </Button>
        </div>
        {chat.files.previews.length > 0 && (
          <div className="ml-3 flex flex-wrap gap-2 overflow-x-auto items-center">
            {chat.files.previews.map((src) => (
              <img
                key={src}
                src={src}
                className="h-15 rounded-md object-cover border"
                loading="lazy"
              />
            ))}
            <Button
              variant="destructive"
              className="h-10"
              onClick={chat.files.clearFiles}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
