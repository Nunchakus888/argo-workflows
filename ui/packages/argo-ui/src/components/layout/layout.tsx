import * as React from 'react';
import {NavBarStyle} from '../nav-bar/nav-bar';

require('./layout.scss');

export interface LayoutProps {
    navItems?: Array<{ path: string; iconClassName: string; title: string; }>;
    version?: () => React.ReactElement;
    navBarStyle?: NavBarStyle;
    theme?: string;
    children?: React.ReactNode;
}

export const Layout = (props: LayoutProps) => (
    <div className={props.theme ? 'theme-' + props.theme : 'theme-light'}>
        <div className='layout'>
            {props.children}
        </div>
    </div>
);
