import styled from "@emotion/styled";
import { colors } from "@src/pages/content/theme";
import { OpenAIRoles } from "@src/pages/content/types.d";
import { ReactNode } from "react";

type Props = {
  role: OpenAIRoles.user | OpenAIRoles.assistant;
  content: string | ReactNode;
};

const Message = ({ role, content }: Props) => {
  return (
    <Container role={role}>
      <span>{role === OpenAIRoles.assistant ? "🤖" : "👤"}</span>

      <p>{content}</p>
    </Container>
  );
};

export default Message;

const Container = styled.div`
  display: flex;
  gap: 1rem;

  padding: 0.5rem 1rem;

  background-color: ${(props) =>
    props.role === "user" ? "white" : colors.gray[50]};
  border-bottom: 1px solid ${colors.slate[200]};

  p {
    margin: 0;
  }
`;
