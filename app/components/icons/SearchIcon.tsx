import BaseIcon from "./BaseIcon";
import { IconProps } from "./types";

export default function SearchIcon(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
            />
        </BaseIcon>
    );
}
