import BaseIcon from "./BaseIcon";
import { IconProps } from "./types";

export function GithubIcon({ size = 24, className }: IconProps) {
    return (
        <BaseIcon size={size} className={className}>
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
                <path
                    fillRule="evenodd"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63.06 1.08.64 1.48 1.05.08.08.16.11.25.11.53 1.15 1.57.36 1.94.28.08-.65.32-1.11.58-1.35-1.5-.15-3.05-.74-3.05-3.27 0-.72.26-1.31.69-1.77-.07-.15-.3-.83.63-1.74 0 0 .56-.18 1.84.65.54-.15 1.13-.22 1.74-.22.61 0 1.19.07 1.74.22 1.27-.83 1.83-.65 1.83-.65.93.91.7 1.59.64 1.74.43.46.69 1.05.69 1.77 0 2.54-1.55 3.12-3.06 3.27.23.2.44.61.44 1.23 0 .89-.01 1.6-.01 1.84 0 .21.15.45.55.38 3.17-1.07 5.46-4.06 5.46-7.58C16 3.58 12.42 0 8 0z"
                />
            </svg>
        </BaseIcon>
    );
}

export function XIcon({ size = 24, className }: IconProps) {
    return (
        <BaseIcon size={size} className={className}>
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.664-1.48 2.033-2.53-.886.52-1.864.89-2.908 1.1-.828-.88-2.007-1.432-3.318-1.432-2.512 0-4.551 2.039-4.551 4.55a1.708 1.708 0 0 0 .145.856 4.534 4.534 0 0 1-3.332-1.684 4.534 4.534 0 0 1-.676 2.234c0 1.57 1.603 2.853 3.643 2.983-.789-.023-1.531-.242-2.163-.594v.057c0 2.193 1.567 4.01 3.643 4.437-.383.103-.783.156-1.196.156-.297 0-.587-.03-.864-.086.58 1.79 2.263 3.11 4.26 3.15A4.54 4.54 0 0 1 5.185 19.85a9.055 9.055 0 0 0 11.362-4.551c1.49-1.479 2.475-3.324 2.977-5.384a4.54 4.54 0 0 0 1.349-1.827l-.001-.079z" />
            </svg>
        </BaseIcon>
    );
}

export function HatenaIcon({ size = 24, className }: IconProps) {
    return (
        <BaseIcon size={size} className={className}>
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
        </BaseIcon>
    );
}

export function MenuIcon({ size = 24, className }: IconProps) {
    return (
        <BaseIcon size={size} className={className}>
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
