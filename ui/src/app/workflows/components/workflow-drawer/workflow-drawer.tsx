import * as React from 'react';
import {useEffect, useState} from 'react';

import {Workflow} from '../../../../models';
import {InlineTable} from '../../../shared/components/inline-table/inline-table';
import {Loading} from '../../../shared/components/loading';
import {ConditionsPanel} from '../../../shared/conditions-panel';
import {formatDuration} from '../../../shared/duration';
import {services} from '../../../shared/services';
import {WorkflowCreatorInfo} from '../workflow-creator-info/workflow-creator-info';
import {WorkflowFrom} from '../workflow-from';
import {WorkflowLabels} from '../workflow-labels/workflow-labels';
import {useTranslation} from 'react-i18next';

import './workflow-drawer.scss';

interface WorkflowDrawerProps {
    name: string;
    namespace: string;
    onChange: (key: string) => void;
}

export function WorkflowDrawer(props: WorkflowDrawerProps) {
    const [wf, setWorkflow] = useState<Workflow>();
    const {t} = useTranslation();

    useEffect(() => {
        (async () => {
            const newWf = await services.workflows.get(props.namespace, props.name);
            setWorkflow(newWf);
        })();
    }, [props.namespace, props.name]);

    if (!wf) {
        return <Loading />;
    }

    return (
        <div className='workflow-drawer'>
            {!wf.status || !wf.status.message ? null : (
                <div className='workflow-drawer__section workflow-drawer__message'>
                    <div className='workflow-drawer__title workflow-drawer__message--label'>{t('workflowList.drawer.MESSAGE')}</div>
                    <div className='workflow-drawer__message--content'>{wf.status.message}</div>
                </div>
            )}
            {!wf.status || !wf.status.conditions ? null : (
                <div className='workflow-drawer__section'>
                    <div className='workflow-drawer__title'>{t('workflowList.drawer.CONDITIONS')}</div>
                    <div className='workflow-drawer__conditions'>
                        <ConditionsPanel conditions={wf.status.conditions} />
                    </div>
                </div>
            )}
            {!wf.status || !wf.status.resourcesDuration ? null : (
                <div className='workflow-drawer__section'>
                    <div>
                        <InlineTable
                            rows={[
                                {
                                    left: (
                                        <div className='workflow-drawer__title'>
                                            {t('workflowList.drawer.RESOURCES_DURATION')}
                                        </div>
                                    ),
                                    right: (
                                        <div>
                                            <div>
                                                <span className='workflow-drawer__resourcesDuration--value'>{formatDuration(wf.status.resourcesDuration.cpu, 1)}</span>
                                                <span>(*1 CPU)</span>
                                            </div>
                                            <div>
                                                <span className='workflow-drawer__resourcesDuration--value'>{formatDuration(wf.status.resourcesDuration.memory, 1)}</span>
                                                <span>(*100Mi Memory)</span>
                                            </div>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </div>
                </div>
            )}
            <div className='workflow-drawer__section'>
                <div className='workflow-drawer__title'>{t('workflowList.drawer.FROM')}</div>
                <div className='workflow-drawer__workflowFrom'>
                    <WorkflowFrom namespace={wf.metadata.namespace || 'default'} labels={wf.metadata.labels || {}} />
                </div>
            </div>
            <div className='workflow-drawer__section workflow-drawer__labels'>
                <div className='workflow-drawer__title'>{t('workflowList.drawer.LABELS')}</div>
                <div className='workflow-drawer__labels--list'>
                    <WorkflowLabels
                        workflow={wf}
                        onChange={key => {
                            props.onChange(key);
                        }}
                    />
                </div>
            </div>
            <div className='workflow-drawer__section workflow-drawer__labels'>
                <div className='workflow-drawer__title'>{t('workflowList.drawer.Creator')}</div>
                <div className='workflow-drawer__labels--list'>
                    <WorkflowCreatorInfo
                        workflow={wf}
                        onChange={key => {
                            props.onChange(key);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
