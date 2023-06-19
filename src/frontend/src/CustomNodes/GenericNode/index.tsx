import { classNames, nodeColors, nodeIcons, toTitleCase } from "../../utils";
import ParameterComponent from "./components/parameterComponent";
import InputParameterComponent from "./components/inputParameterComponent";
import { typesContext } from "../../contexts/typesContext";
import { useContext, useState, useEffect, useRef } from "react";
import { NodeDataType } from "../../types/flow";
import { alertContext } from "../../contexts/alertContext";
import { PopUpContext } from "../../contexts/popUpContext";
import NodeModal from "../../modals/NodeModal";
import Tooltip from "../../components/TooltipComponent";
import { NodeToolbar } from "reactflow";
import NodeToolbarComponent from "../../pages/FlowPage/components/nodeToolbarComponent";

import ShadTooltip from "../../components/ShadTooltipComponent";
import { useSSE } from "../../contexts/SSEContext";

export default function GenericNode({
  data,
  selected,
}: {
  data: NodeDataType;
  selected: boolean;
}) {
  const { setErrorData } = useContext(alertContext);
  const showError = useRef(true);
  const { types, deleteNode } = useContext(typesContext);

  const { closePopUp, openPopUp } = useContext(PopUpContext);

  const Icon = nodeIcons[data.type] || nodeIcons[types[data.type]];
  const [validationStatus, setValidationStatus] = useState(null);
  // State for outline color
  const { sseData, isBuilding } = useSSE();

  // useEffect(() => {
  //   if (reactFlowInstance) {
  //     setParams(Object.values(reactFlowInstance.toObject()));
  //   }
  // }, [save]);

  // New useEffect to watch for changes in sseData and update validation status
  useEffect(() => {
    const relevantData = sseData[data.id];
    if (relevantData) {
      // Extract validation information from relevantData and update the validationStatus state
      setValidationStatus(relevantData);
    } else {
      setValidationStatus(null);
    }
  }, [sseData, data.id]);

  if (!Icon) {
    if (showError.current) {
      setErrorData({
        title: data.type
          ? `The ${data.type} node could not be rendered, please review your json file`
          : "There was a node that can't be rendered, please review your json file",
      });
      showError.current = false;
    }
    deleteNode(data.id);
    return;
  }

  useEffect(() => {}, [closePopUp, data.node.template]);

  return (
    <>
      <NodeToolbar>
        <NodeToolbarComponent
          data={data}
          openPopUp={openPopUp}
          deleteNode={deleteNode}
        ></NodeToolbarComponent>
      </NodeToolbar>
      <div>
        <div
          className={classNames(
            selected ? "border border-ring" : "border dark:border-gray-700",
            "prompt-node relative flex w-96 flex-col justify-center rounded-lg bg-white dark:bg-gray-900"
          )}
        >
          <div className="flex w-full items-center justify-between gap-8 rounded-t-lg border-b bg-muted p-4 dark:border-b-gray-700 dark:bg-gray-800 dark:text-white ">
            <div className="flex w-full items-center gap-2 truncate text-lg">
              <ShadTooltip content={data.type}>
                <Icon
                  className="h-10 w-10 rounded p-1"
                  style={{
                    color: nodeColors[types[data.type]] ?? nodeColors.unknown,
                  }}
                />
              </ShadTooltip>
              <div className="ml-2 truncate">
                <ShadTooltip delayDuration={1500} content={data.type}>
                  <div className="ml-2 truncate text-gray-800">{data.type}</div>
                </ShadTooltip>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="relative"
                onClick={(event) => {
                  event.preventDefault();
                  openPopUp(<NodeModal data={data} />);
                }}
              ></button>
            </div>
            <div className="flex gap-3">
              <div>
                <Tooltip
                  title={
                    !validationStatus ? (
                      "Validating..."
                    ) : (
                      <div className="max-h-96 overflow-auto">
                        {validationStatus.params ||
                          ""
                            .split("\n")
                            .map((line, index) => (
                              <div key={index}>{line}</div>
                            ))}
                      </div>
                    )
                  }
                >
                  <div className="w-5 h-5 relative top-[3px]">
                    <div
                      className={classNames(
                        validationStatus && validationStatus.valid
                          ? "w-4 h-4 rounded-full bg-green-500 opacity-100"
                          : "w-4 h-4 rounded-full bg-gray-500 opacity-0 hidden animate-spin",
                        "absolute w-4 hover:text-gray-500 hover:dark:text-gray-300 transition-all ease-in-out duration-200"
                      )}
                    ></div>
                    <div
                      className={classNames(
                        validationStatus && !validationStatus.valid
                          ? "w-4 h-4 rounded-full  bg-red-500 opacity-100"
                          : "w-4 h-4 rounded-full bg-gray-500 opacity-0 hidden animate-spin",
                        "absolute w-4 hover:text-gray-500 hover:dark:text-gray-300 transition-all ease-in-out duration-200"
                      )}
                    ></div>
                    <div
                      className={classNames(
                        !validationStatus || isBuilding
                          ? "w-4 h-4 rounded-full  bg-yellow-500 opacity-100"
                          : "w-4 h-4 rounded-full bg-gray-500 opacity-0 hidden animate-spin",
                        "absolute w-4 hover:text-gray-500 hover:dark:text-gray-300 transition-all ease-in-out duration-200"
                      )}
                    ></div>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="h-full w-full py-5 text-gray-800">
            <div className="w-full px-5 pb-3 text-sm text-muted-foreground">
              {data.node.description}
            </div>

            <>
              {Object.keys(data.node.template)
                .filter((field_name) => field_name.charAt(0) !== "_")
                .map((field_name: string, idx) => (
                  <div key={idx}>
                    {/* {idx === 0 ? (
									<div
										className={classNames(
											"px-5 py-2 mt-2 dark:text-white text-center",
											Object.keys(data.node.template).filter(
												(key) =>
													!key.startsWith("_") &&
													data.node.template[key].show &&
													!data.node.template[key].advanced
											).length === 0
												? "hidden"
												: ""
										)}
									>
										Inputs
									</div>
								) : (
									<></>
								)} */}
                    {data.node.template[field_name].show &&
                    field_name != "root_field" &&
                    !data.node.template[field_name].advanced ? (
                      <ParameterComponent
                        data={data}
                        color={
                          nodeColors[
                            types[data.node.template[field_name].type]
                          ] ?? nodeColors.unknown
                        }
                        title={
                          data.node.template[field_name].display_name
                            ? data.node.template[field_name].display_name
                            : data.node.template[field_name].name
                            ? toTitleCase(data.node.template[field_name].name)
                            : toTitleCase(field_name)
                        }
                        name={field_name}
                        tooltipTitle={data.node.template[field_name].type}
                        required={data.node.template[field_name].required}
                        id={
                          data.node.template[field_name].type +
                          "|" +
                          field_name +
                          "|" +
                          data.id
                        }
                        left={true}
                        type={data.node.template[field_name].type}
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                ))}
              <div
                className={classNames(
                  Object.keys(data.node.template).length < 1 ? "hidden" : "",
                  "flex w-full justify-center"
                )}
              >
                {" "}
              </div>
              {/* <div className="px-5 py-2 mt-2 dark:text-white text-center">
						Output
					</div> */}

              {data.node.template.root_field ? (
                <InputParameterComponent
                  data={data}
                  color={nodeColors[types[data.type]] ?? nodeColors.unknown}
                  title={data.node.template.root_field.display_name}
                  tooltipTitle={`${data.node.base_classes.join("\n")}`}
                  id={
                    data.node.template.root_field.type +
                    "|" +
                    "root_field" +
                    "|" +
                    data.id
                  }
                  type={data.node.base_classes.join("|")}
                  left={false}
                />
              ) : (
                <ParameterComponent
                  data={data}
                  color={nodeColors[types[data.type]] ?? nodeColors.unknown}
                  title={data.type}
                  tooltipTitle={`${data.node.base_classes.join("\n")}`}
                  id={[data.type, data.id, ...data.node.base_classes].join("|")}
                  type={data.node.base_classes.join("|")}
                  left={false}
                />
              )}
            </>
          </div>
        </div>
      </div>
    </>
  );
}
