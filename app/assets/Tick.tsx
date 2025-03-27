import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface TickProps {
  width?: number;
  height?: number;
  color?: string;
}

const Tick: React.FC<TickProps> = ({ 
  width = 26, 
  height = 26, 
  color = "#000" 
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
        fill={color}
      />
    </Svg>
  );
};

export default Tick; 