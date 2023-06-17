import { useState } from "react";
import html2canvas from "html2canvas";
import { useQuery } from "@tanstack/react-query";
import { FiMessageSquare } from "react-icons/fi";
import { RxPaperPlane } from "react-icons/rx";
import { Button, PrimaryButton, Input } from "@pages/content/Primitives";
import { colors } from "@src/pages/content/theme";
import styled from "@emotion/styled";
import Message from "@pages/content/Message";
import { BeatLoader } from "react-spinners";
import { OpenAIRoles } from "@src/pages/content/types.d";

const getNodeImg = async (node: HTMLElement) => {
  const canvas = await html2canvas(node);

  const imageType = "image/png";
  return canvas.toDataURL(imageType);
};

const getTxtFromImg = async (img: string) => {
  const res = await fetch("https://api.mathpix.com/v3/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_key: import.meta.env.VITE_MATHPIX_APP_KEY,
      app_id: import.meta.env.VITE_MATHPIX_APP_ID,
    },
    body: JSON.stringify({
      src: img,
      formats: ["text", "data"],
      data_options: { include_asciimath: true, include_latex: true },
    }),
  });

  const data = await res.json();

  return data.text;
};

const getSketchpadText = async () => {
  const sketchContainer = document.querySelector(
    "div[data-test-id='drawing-area']"
  );

  if (!sketchContainer) return;

  const sketchNode = sketchContainer.children[1];
  const sketchImg = await getNodeImg(sketchNode as HTMLElement);
  const sketchTxt = await getTxtFromImg(sketchImg);

  return sketchTxt;
};

const gpt = async (messages: ChatMessage[]): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-0613",
      messages,
      functions: [
        {
          name: "getSketchpadText",
          description:
            "a function that takes a snapshot of the user's sketchpad and extracts the text from it for GPT to use it. This function needs to be called when the user asks for help with their work/steps in the drawing/sketch/sketchpad/pad",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      ],
    }),
  });

  const data = await response.json();

  const choice = data.choices[0];

  if (choice.finish_reason !== "function_call") return choice.message.content;

  const functionName: string = choice.message.function_call.name;

  if (functionName !== "getSketchpadText")
    return "Sorry, I couldn't understand that. Could you try rephrasing please?";

  const sketchText = await getSketchpadText();

  const updatedMessages = [
    ...messages,
    {
      role: OpenAIRoles.function,
      name: functionName,
      content: sketchText,
    },
  ];

  const result = await gpt(updatedMessages);

  return result;
};

const getQsnTxt = async () => {
  const answerFormNode = document.querySelector("form[name='answerform']");
  if (!answerFormNode) return;

  const qsnImg = await getNodeImg(answerFormNode as HTMLElement);
  const qsnText = await getTxtFromImg(qsnImg);

  return qsnText;
};

const defaultMessage =
  "Hi! I'm a bot. I can help you with your math homework. Just type in your query and I'll do my best to answer it.";

enum ChatStatus {
  idle,
  loading,
  success,
  error,
}

type ChatMessage = {
  role: OpenAIRoles;
  content: string;
};

const GippitySensei = () => {
  const { data } = useQuery({
    queryKey: ["qsnText"],
    queryFn: getQsnTxt,
  });

  const [showChatbot, setShowChatbot] = useState(false);

  const [userQuery, setUserQuery] = useState("");
  const [chatStatus, setChatStatus] = useState(ChatStatus.idle);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: OpenAIRoles.system,
      content:
        "You are a math tutor who is amazing at helping K-12 students at the step level. You will be given a question and a step of the learner. You need to guide the learner through socratic dialogue to fix errors in their current step and solve the question by asking questions instead of giving them the solution steps. If the learner has arrived at the answer then acknowledge it and congratulate them. Never give the answer back. Use latex syntax with $ as delimeter.",
    },
  ]);

  const handleSubmit = async () => {
    setChatStatus(ChatStatus.loading);

    const currentMessages = [...messages];

    setMessages((prev) => [
      ...prev,
      { role: OpenAIRoles.user, content: userQuery },
    ]);
    setUserQuery("");

    try {
      const res = await gpt([
        ...currentMessages,
        {
          role: OpenAIRoles.user,
          content: `Question: ${data}. Learner's query: ${userQuery}`,
        },
      ]);
      console.log("res", res);
      setMessages((prev) => [
        ...prev,
        {
          role: OpenAIRoles.assistant,
          content: res,
        },
      ]);

      setChatStatus(ChatStatus.success);
    } catch (error) {
      console.error(error);
      setChatStatus(ChatStatus.error);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        marginLeft: "1rem",
      }}
    >
      <Button onClick={() => setShowChatbot((prev) => !prev)}>
        <FiMessageSquare size={16} color={colors.blue[600]} />
      </Button>

      {showChatbot && (
        <ChatbotContainer>
          <ChatbotHeader>
            <ChatbotTitle>🔮 Gippity Sensei</ChatbotTitle>
          </ChatbotHeader>

          <MessageList>
            <Message role={OpenAIRoles.assistant} content={defaultMessage} />

            {messages.map(
              (msg, i) =>
                (msg.role === OpenAIRoles.user ||
                  msg.role === OpenAIRoles.assistant) && (
                  <Message key={i} role={msg.role} content={msg.content} />
                )
            )}

            {chatStatus === ChatStatus.loading && (
              <Message
                role={OpenAIRoles.assistant}
                content={<BeatLoader size={2.5} />}
              />
            )}

            {chatStatus === ChatStatus.error && (
              <Message
                role={OpenAIRoles.assistant}
                content="Sorry, something went wrong. Please try again"
              />
            )}
          </MessageList>

          <MessageContainer onSubmit={handleSubmit}>
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="How can I help you?"
            />

            <PrimaryButton type="submit" onClick={handleSubmit}>
              <RxPaperPlane size={16} color="white" />
            </PrimaryButton>
          </MessageContainer>
        </ChatbotContainer>
      )}
    </div>
  );
};

export default GippitySensei;

const ChatbotContainer = styled.div`
  position: absolute;
  bottom: 60px;

  border: 1.5px solid;
  border-color: ${colors.slate[300]};
  border-radius: 8px;

  width: 500px;
  height: 400px;

  overflow: hidden;

  display: flex;
  flex-direction: column;

  background-color: white;
`;

const ChatbotHeader = styled.div`
  padding: 0.5rem 1rem;

  border-bottom: 1.5px solid;
  border-color: ${colors.slate[300]};
`;

const ChatbotTitle = styled.h1`
  margin: 0;
`;

const MessageContainer = styled.form`
  padding: 0.5rem 1rem;

  display: flex;
  gap: 0.5rem;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;

  flex: 1;

  max-height: 100%;
  overflow-y: auto;
`;
