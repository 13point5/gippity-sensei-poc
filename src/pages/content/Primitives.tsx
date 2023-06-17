import styled from "@emotion/styled";
import { colors } from "@src/pages/content/theme";

export const Button = styled.button`
  width: 2rem;
  height: 2rem;

  border: 1px solid;
  border-color: ${colors.slate[300]};
  border-radius: 4px;

  background-color: white;

  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const PrimaryButton = styled(Button)`
  background-color: ${colors.blue[500]};
  color: white;
`;

export const Input = styled.input`
  padding: 0.25rem 0.5rem;
  width: 100%;

  outline: none;

  border: 1px solid;
  border-color: ${colors.slate[300]};
  border-radius: 4px;

  &:active,
  &:focus {
    border: 2px solid;
    border-color: ${colors.blue[500]};
  }
`;
