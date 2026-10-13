import React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { StepIconProps } from "@mui/material/StepIcon";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { styled } from "@mui/material/styles";
interface Props {
    currentStep: 0 | 1 | 2; 
    onClose: () => void;
    onStepClick?: (step: 0 | 1 | 2) => void; 
    completedSteps?: Set<number>; 
}

const STEPS = ["Upload JRF", "Client Details", "Requirements"];
const CustomConnector = styled(StepConnector)(() => ({
    cursor: 'pointer', 
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 13, // align with center of 28px circle
        left: "calc(-50% + 14px)",   // ← add this
        right: "calc(50% + 14px)",    // ← add this
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 2,
        border: 0,
        backgroundColor: "#E5E7EB",
        borderRadius: 2,
        cursor: 'pointer',  
    },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        backgroundColor: "#0F2A44",
    },
    [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        backgroundColor: "#0F2A44",
    },
}));

// ─── Custom Step Icon ─────────────────────────────────────────────────────────
const IconRoot = styled("div")<{
    ownerState: { active?: boolean; completed?: boolean; clickable?: boolean  };
}>(({ ownerState }) => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.2s",
     cursor: ownerState.clickable ? 'pointer' : 'default',  
    ...(ownerState.completed && {
        backgroundColor: "#0F2A44",
        color: "#fff",
    }),
    // Active
    ...(ownerState.active && {
        backgroundColor: "#0F2A44",
        color: "#fff",
        boxShadow: "0 0 0 4px rgba(15,42,68,0.12)",
    }),
    // Inactive
    ...(!ownerState.active && !ownerState.completed && {
        backgroundColor: "#fff",
        border: "1.5px solid #a9adb3",
        color: "#9CA3AF",
    }),
}));
interface CustomStepIconProps extends StepIconProps {
    clickable?: boolean;
}
const CustomStepIcon = (props: CustomStepIconProps) => {
    const { active, completed, icon, clickable } = props;
    return (
        <IconRoot ownerState={{ active, completed, clickable}}>
            {completed
                ? <CheckIcon sx={{ fontSize: 14 }} />
                : icon
            }
        </IconRoot>
    );
};

// ─── StepperHeader ────────────────────────────────────────────────────────────
const StepperHeader: React.FC<Props> = ({ currentStep, onClose, onStepClick,completedSteps = new Set() }) => {
    return (
        <Box sx={{ px: 3, pt: 1.5, pb: 0.5, borderBottom: "1px solid #F3F4F6" }}>

            {/* Title Row */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",pb: 1.0 }}>
                <Box>
                    <Box component="h2" sx={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "#0F2A44",
                        m: 0,
                        lineHeight: 1.3,
                    }}>
                        Add New Requirement
                    </Box>
                </Box>

                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{ color: "#9CA3AF", "&:hover": { color: "#374151" } }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* MUI Stepper */}
            <Stepper
                activeStep={currentStep}
                alternativeLabel
                connector={<CustomConnector />}
                sx={{ cursor: 'default' }} 
            >
           {STEPS.map((label, index) => {
    const stepIndex = index as 0 | 1 | 2;

    const isClickable =
        onStepClick && (
                stepIndex < currentStep ||                          // always go back to any previous step
                 (currentStep === 0 && stepIndex === 1) ||            // Step 1 → circle 2
                (currentStep === 0 && stepIndex === 2
                && completedSteps.has(1)) ||                       // Step 1 → circle 3 (only if Step 2 done)
                (currentStep === 1 && stepIndex === 2)               // Step 2 → circle 3
            );

    return (
        <Step key={label}>
            <StepLabel
                 StepIconComponent={(iconProps) => (
        <CustomStepIcon {...iconProps} clickable={!!isClickable} />
    )}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();  // ← stops MUI from swallowing the event
                    if (isClickable && typeof onStepClick === 'function') {
                        onStepClick(stepIndex);
                    }
                }}
                sx={{
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    '& .MuiStepLabel-iconContainer': {
                        transition: 'transform 0.2s ease',
                        ...(isClickable && {
                            '&:hover': {
                                transform: 'scale(1.15)',
                            },
                        }),
                    },
                    "& .MuiStepLabel-label": {
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        color: isClickable ? "#0F2A44" : "#9CA3AF",
                        mt: 0.5,
                        transition: 'color 0.2s ease',
                        ...(isClickable && {
                            '&:hover': { 
                                color: "#0F2A44",
                                textDecoration: 'underline',
                            },
                        }),
                    },
                    "& .MuiStepLabel-label.Mui-active": {
                        color: "#0F2A44",
                        fontWeight: 600,
                    },
                    "& .MuiStepLabel-label.Mui-completed": {
                        color: "rgba(15,42,68,0.5)",
                        fontWeight: 500,
                    },
                }}
            >
                {label}
            </StepLabel>
        </Step>
    );
})}
            </Stepper>
        </Box>
    );
};

export default StepperHeader;
