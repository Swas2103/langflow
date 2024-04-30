import { useEffect } from "react";
import {
  PROMPT_SUCCESS_ALERT,
  TEMP_NOTICE_ALERT,
} from "../../constants/alerts_constants";
import { deleteGlobalVariable } from "../../controllers/API";
import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal";
import useAlertStore from "../../stores/alertStore";
import { useGlobalVariablesStore } from "../../stores/globalVariables";
import { ResponseErrorDetailAPI } from "../../types/api";
import { InputGlobalComponentType } from "../../types/components";
import { validatePrompt } from "../../utils/parameterUtils";
import { cn } from "../../utils/utils";
import AddNewVariableButton from "../addNewVariableButtonComponent/addNewVariableButton";
import ForwardedIconComponent from "../genericIconComponent";
import InputComponent from "../inputComponent";
import { CommandItem } from "../ui/command";

export default function InputGlobalComponent({
  disabled,
  onChange,
  setDb,
  multiline,
  setPromptNodeClass,
  name,
  data,
  editNode = false,
  id,
}: InputGlobalComponentType): JSX.Element {
  const globalVariablesEntries = useGlobalVariablesStore(
    (state) => state.globalVariablesEntries
  );
  const globalVariables = useGlobalVariablesStore(
    (state) => state.globalVariables
  );

  const getVariableId = useGlobalVariablesStore((state) => state.getVariableId);
  const removeGlobalVariable = useGlobalVariablesStore(
    (state) => state.removeGlobalVariable
  );
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const setNoticeData = useAlertStore((state) => state.setNoticeData);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);

  useEffect(() => {
    if (data.node?.template[name])
      if (
        !globalVariablesEntries.includes(data.node?.template[name].value) &&
        data.node?.template[name].load_from_db
      ) {
        onChange("");
        setDb(false);
      }
  }, [globalVariablesEntries]);

  function handleDelete(key: string) {
    const id = getVariableId(key);
    if (id !== undefined) {
      deleteGlobalVariable(id)
        .then((_) => {
          removeGlobalVariable(key);
          if (
            data?.node?.template[name].value === key &&
            data?.node?.template[name].load_from_db
          ) {
            onChange("");
            setDb(false);
          }
        })
        .catch((error) => {
          let responseError = error as ResponseErrorDetailAPI;
          setErrorData({
            title: "Error deleting variable",
            list: [responseError.response.data.detail ?? "Unknown error"],
          });
        });
    } else {
      setErrorData({
        title: "Error deleting variable",
        list: [cn("ID not found for variable: ", key)],
      });
    }
  }
  return (
    <InputComponent
      id={id || "input-" + name}
      editNode={editNode}
      multiline={multiline}
      setPromptNodeClass={setPromptNodeClass}
      promptNodeClass={data.node}
      name={name}
      readonly={data.node?.flow ? true : false}
      disabled={disabled}
      password={data.node?.template[name].password ?? false}
      value={
        setPromptNodeClass && data.node?.template[name].load_from_db === true
          ? globalVariables[data.node?.template[name].value]?.value ?? ""
          : data.node?.template[name].value ?? ""
      }
      options={
        setPromptNodeClass
          ? Object.keys(globalVariables).filter(
              (g) => globalVariables[g].category == "Prompt"
            )
          : globalVariablesEntries
      }
      optionsPlaceholder={"Global Variables"}
      optionsIcon="Globe"
      optionsButton={
        <AddNewVariableButton
          defaultCategory={setPromptNodeClass ? "Prompt" : "Generic"}
        >
          <CommandItem value="doNotFilter-addNewVariable">
            <ForwardedIconComponent
              name="Plus"
              className={cn("mr-2 h-4 w-4 text-primary")}
              aria-hidden="true"
            />
            <span>Add New Variable</span>
          </CommandItem>
        </AddNewVariableButton>
      }
      optionButton={(option) => (
        <DeleteConfirmationModal
          onConfirm={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleDelete(option);
          }}
          description={'variable "' + option + '"'}
          asChild
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="pr-1"
          >
            <ForwardedIconComponent
              name="Trash2"
              className={cn(
                "h-4 w-4 text-primary opacity-0 hover:text-status-red group-hover:opacity-100"
              )}
              aria-hidden="true"
            />
          </button>
        </DeleteConfirmationModal>
      )}
      selectedOption={
        data?.node?.template[name].load_from_db ?? false
          ? data?.node?.template[name].value
          : ""
      }
      setSelectedOption={(value) => {
        if (setPromptNodeClass) {
          let newNode = {
            ...(data.node ?? {}),
            template: {
              ...data.node?.template,
              [name]: {
                ...data.node?.template?.[name],
                value: value,
                load_from_db: value !== "" ? true : false,
              },
            },
          };
          validatePrompt(value, name, newNode, setPromptNodeClass)
            .then((inputVariables) => {
              if (inputVariables.length === 0 && value !== "") {
                setNoticeData({
                  title: TEMP_NOTICE_ALERT,
                });
              } else {
                setSuccessData({
                  title: PROMPT_SUCCESS_ALERT,
                });
              }
            })
            .catch((e) => {
              setErrorData(e);
            });
        } else {
          onChange(value);
          setDb(value !== "" ? true : false);
        }
      }}
      onChange={(value) => {
        onChange(value);
        if(data?.node?.template[name].load_from_db){
          setDb(false);
        }
      }}
    />
  );
}
