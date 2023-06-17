import { createRoot } from "react-dom/client";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState, useEffect, useRef } from "react";
import { Root } from "react-dom/client";
import GippitySensei from "@src/pages/content/GippitySensei";

refreshOnUpdate("pages/content");

const persEdRootId = "persed-app";

const mountApp = () => {
  let persEdRoot = document.getElementById(persEdRootId);

  if (!persEdRoot) {
    persEdRoot = document.createElement("div");
    persEdRoot.id = persEdRootId;
    persEdRoot.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
  }

  const drawBtn = document.querySelector(
    'button[data-test-id="toggle-drawing-area"]'
  );
  drawBtn?.insertAdjacentElement("afterend", persEdRoot);

  const root = createRoot(persEdRoot);
  root.render(
    <QueryClientProvider client={queryClient}>
      <GippitySensei />
    </QueryClientProvider>
  );

  return root;
};

const queryClient = new QueryClient();

function App() {
  const [found, setFound] = useState(false);
  const rootRef = useRef<Root | undefined>();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const answerFormNode = document.querySelector("form[name='answerform']");
      const taskContainer = document.querySelector(".task-container");

      if (taskContainer && answerFormNode) {
        setFound(true);
      } else {
        setFound(false);
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleMountApp = () => {
    rootRef.current = mountApp();
  };

  useEffect(() => {
    if (found) {
      console.log("found the node");

      handleMountApp();

      const qsnContentObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type !== "childList" || mutation.addedNodes.length === 0)
            return;

          // check if any added node has innerText starting with "Problem"
          const isProblemNode = Array.from(mutation.addedNodes).find((node) => {
            return node.innerText?.startsWith("Problem");
          });

          if (isProblemNode) {
            handleMountApp();
            qsnContentObserver.disconnect();
          }
        });
      });

      qsnContentObserver.observe(document, {
        childList: true,
        subtree: true,
      });
    } else {
      rootRef.current?.unmount();
    }
  }, [found]);

  return <div></div>;
}

const root = document.createElement("div");
root.id = "persed-test-root";
document.body.append(root);

createRoot(root).render(<App />);
