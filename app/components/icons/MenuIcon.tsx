import BaseIcon from "./BaseIcon";
import { IconProps } from "./types";

export default function MenuIcon(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
            />
        </BaseIcon>
    );
}
