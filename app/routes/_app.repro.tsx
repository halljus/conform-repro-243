import * as React from 'react';
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { getFieldsetConstraint, parse, refine } from '@conform-to/zod';
import { conform, useForm, type FieldConfig } from '@conform-to/react';
import { z } from 'zod';
import { Button, Col, Form, Row, Stack } from 'react-bootstrap';
import { toast } from 'react-toastify';
import reactToastifyStylesHref from 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import type { ArchivableOptionGroup, ArchivableSelectOption } from '~/core/types';
import {
  createContributingFactor,
  isExistingContributingFactor,
  getGroupedContributingFactorOptions,
} from '~/contributing-factors/contributing-factor.server';

const newContributingFactorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export function links() {
  return [{ rel: 'stylesheet', href: reactToastifyStylesHref }];
}

export async function loader({ request }: LoaderArgs) {
  return json({ groupedContributingFactorOptions: await getGroupedContributingFactorOptions() });
}

export default function AdminContributingFactors() {
  const { groupedContributingFactorOptions } = useLoaderData<typeof loader>();
  const newEntryFetcher = useFetcher<typeof action>();
  const isSubmittingNewEntry = newEntryFetcher.state !== 'idle';
  const lastNewEntrySubmission = newEntryFetcher.data?.submission;
  const didNewEntrySubmissionSucceed =
    !isSubmittingNewEntry && newEntryFetcher.data?.status === 'success';
  const [isNewEntryFormValidated, setIsNewEntryFormValidated] = React.useState(false);
  const [newEntryForm, newEntryFields] = useForm({
    id: React.useId(),
    constraint: getFieldsetConstraint(newContributingFactorSchema),
    defaultValue: { name: '' },
    lastSubmission: lastNewEntrySubmission,
    onValidate({ formData }) {
      setIsNewEntryFormValidated(true);
      return parse(formData, { schema: newContributingFactorSchema });
    },
    shouldRevalidate: 'onBlur',
  });
  const newEntryNameInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (lastNewEntrySubmission) {
      console.log('lastNewEntrySubmission:', JSON.stringify(lastNewEntrySubmission, null, 2));
    }
  }, [lastNewEntrySubmission]);

  React.useEffect(() => {
    if (newEntryFields.name) {
      console.log('newEntryFields.name:', JSON.stringify(newEntryFields.name, null, 2));
    }
  }, [newEntryFields.name]);

  // Clear Bootstrap validation and focus the name input when the form is reset (on success).
  React.useEffect(() => {
    if (didNewEntrySubmissionSucceed && newEntryNameInputRef.current) {
      setIsNewEntryFormValidated(false);
      toast.success('New entry created!');
      newEntryNameInputRef.current.focus();
    }
  }, [didNewEntrySubmissionSucceed]);

  return (
    <>
      <h1 className="h3 mb-5">Contributing Factors</h1>
      <Stack gap={5}>
        <section>
          <h2 className="h4 mb-4">Add a new entry</h2>
          <Form
            as={newEntryFetcher.Form}
            method="post"
            validated={isNewEntryFormValidated}
            {...newEntryForm.props}
          >
            <fieldset disabled={isSubmittingNewEntry}>
              <Row>
                <Col>
                  <Form.Label htmlFor={newEntryFields.name.id}>Name</Form.Label>
                </Col>
              </Row>
              <Row className="gy-3">
                <Col xs={12} md>
                  <Form.Control
                    ref={newEntryNameInputRef}
                    key={newEntryFields.name.defaultValue}
                    defaultValue={newEntryFields.name.defaultValue}
                    type="text"
                    autoComplete="off"
                    {...conform.input(newEntryFields.name, { ariaAttributes: true })}
                  />
                  {newEntryFields.name.initialError || newEntryFields.name.errors?.length ? (
                    <Form.Control.Feedback type="invalid">
                      <FieldErrors config={newEntryFields.name} />
                    </Form.Control.Feedback>
                  ) : null}
                </Col>
                <Col xs={12} md="auto">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    name={conform.INTENT}
                    value="createNewEntry"
                  >
                    Create Entry
                  </Button>
                </Col>
              </Row>
            </fieldset>
          </Form>
        </section>
        <hr />
        <section>
          <h2 className="h4 mb-4">Modify an existing entry</h2>
          <Select<ArchivableSelectOption, false, ArchivableOptionGroup>
            instanceId={React.useId()}
            options={groupedContributingFactorOptions}
            formatOptionLabel={({ label, archived }) => (
              <span className={archived ? 'fst-italic opacity-50' : undefined}>{label}</span>
            )}
          />
        </section>
      </Stack>
    </>
  );
}

function FieldErrors<FieldType>({ config }: { config: FieldConfig<FieldType> }) {
  // TODO: This is a hack to get the initial error message to display. It shouldn't even be in
  // initialError, it should be under name.errors, but it isn't and I don't know why.
  const initialErrorMessages = Object.values(config.initialError ?? {}).filter(
    (initialErrorValue): initialErrorValue is string => typeof initialErrorValue === 'string',
  );
  return (
    <>
      {[...initialErrorMessages, ...(config.errors ?? [])].map((errorMessage) => (
        <p className="mb-0" key={errorMessage}>
          {errorMessage}
        </p>
      ))}
    </>
  );
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: newContributingFactorSchema.superRefine(({ name }, ctx) => {
      return refine(ctx, {
        path: ['name'],
        validate: () => !isExistingContributingFactor?.(name),
        message: 'A Contributing Factor with that name already exists',
      });
    }),
    acceptMultipleErrors: () => true,
    async: true,
  });
  const allowedIntents = ['createNewEntry'];

  console.log(`action submission: ${JSON.stringify(submission, null, 2)}`);

  // Conform performing validation
  if (!allowedIntents.includes(submission.intent)) {
    console.log('action: conform is validating');
    return json({ status: 'idle', submission } as const);
  }

  // Validation failed
  if (!submission.value) {
    console.log('action: validation failed');
    return json({ status: 'error', submission } as const, { status: 400 });
  }

  // Validation succeeded
  console.log('action: validation succeeded');
  if (submission.intent === 'createNewEntry') {
    // insert the new ContributingFactor record into the database
    try {
      await createContributingFactor(submission.value.name);
    } catch (err) {
      console.error(err);
      throw new Response(`Failed to create Contributing Factor: "${submission.payload.name}"`, {
        status: 500,
      });
    }

    return json({
      status: 'success',
      submission: {
        ...submission,
        // Setting the payload to null notifies conform to reset the form on the client.
        payload: null,
      },
    } as const);
  }

  console.log('action: unrecognized intent');

  // Unrecognized intent
  return json({ status: 'error', submission } as const, { status: 400 });
}
