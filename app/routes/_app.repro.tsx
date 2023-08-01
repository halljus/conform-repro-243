import * as React from "react";
import { json, type ActionArgs, type LoaderArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { getFieldsetConstraint, parse, refine } from "@conform-to/zod";
import { conform, useForm, type FieldConfig } from "@conform-to/react";
import { z } from "zod";
import { Button, Col, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import reactToastifyStylesHref from "react-toastify/dist/ReactToastify.css";
import {
  createContributingFactor,
  getContributingFactorByName,
} from "~/contributing-factors/contributing-factor.server";

const createContributingFactorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export function links() {
  return [{ rel: "stylesheet", href: reactToastifyStylesHref }];
}

// Comment out this loader to "fix" the problem?!
export async function loader({ request }: LoaderArgs) {
  return json("anything");
}

export default function AdminContributingFactors() {
  return (
    <>
      <h1 className="h3 mb-5">Contributing Factors</h1>
      <h2 className="h4 mb-4">Add a new entry</h2>
      <CreateContributingFactorForm />
    </>
  );
}

function CreateContributingFactorForm() {
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== "idle";
  const lastSubmission = fetcher.data?.submission;
  const didSubmissionSucceed =
    !isSubmitting && fetcher.data?.status === "success";
  const [isValidated, setIsValidated] = React.useState(false);
  const [form, fields] = useForm({
    id: React.useId(),
    constraint: getFieldsetConstraint(createContributingFactorSchema),
    defaultValue: { name: "" },
    lastSubmission,
    onValidate({ formData }) {
      setIsValidated(true);
      return parse(formData, { schema: createContributingFactorSchema });
    },
    shouldRevalidate: "onBlur",
  });
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (lastSubmission) {
      console.log("lastSubmission:", JSON.stringify(lastSubmission, null, 2));
    }
  }, [lastSubmission]);

  React.useEffect(() => {
    if (fields.name) {
      console.log("fields.name:", JSON.stringify(fields.name, null, 2));
    }
  }, [fields.name]);

  // Clear Bootstrap validation and focus the name input when the form is reset (on success).
  React.useEffect(() => {
    if (didSubmissionSucceed && nameInputRef.current) {
      setIsValidated(false);
      toast.success("New entry created!");
      nameInputRef.current.focus();
    }
  }, [didSubmissionSucceed]);

  return (
    <Form
      as={fetcher.Form}
      method="post"
      validated={isValidated}
      {...form.props}
    >
      <fieldset disabled={isSubmitting}>
        <Row>
          <Col>
            <Form.Label htmlFor={fields.name.id}>Name</Form.Label>
          </Col>
        </Row>
        <Row className="gy-3">
          <Col xs={12} md>
            <Form.Control
              ref={nameInputRef}
              key={fields.name.defaultValue}
              defaultValue={fields.name.defaultValue}
              type="text"
              autoComplete="off"
              {...conform.input(fields.name, { ariaAttributes: true })}
            />
            {fields.name.initialError || fields.name.errors?.length ? (
              <Form.Control.Feedback type="invalid">
                <FieldErrors config={fields.name} />
              </Form.Control.Feedback>
            ) : null}
          </Col>
          <Col xs={12} md="auto">
            <Button type="submit" variant="primary" className="w-100">
              Create Entry
            </Button>
          </Col>
        </Row>
      </fieldset>
    </Form>
  );
}

function FieldErrors<FieldType>({
  config,
}: {
  config: FieldConfig<FieldType>;
}) {
  // TODO: This is a hack to get the initial error message to display. It shouldn't even be in
  // initialError, it should be under name.errors, but it isn't and I don't know why.
  const errorMessages = config.errors?.length
    ? config.errors
    : Object.values(config.initialError ?? {}).filter(
        (initialErrorValue): initialErrorValue is string =>
          typeof initialErrorValue === "string",
      );

  return (
    <>
      {errorMessages.map((errorMessage) => (
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
    schema: createContributingFactorSchema.superRefine(({ name }, ctx) => {
      return refine(ctx, {
        path: ["name"],
        validate: async () => {
          return !(await getContributingFactorByName(name));
        },
        message: "A Contributing Factor with that name already exists",
      });
    }),
    acceptMultipleErrors: () => true,
    async: true,
  });

  console.log(`action submission: ${JSON.stringify(submission, null, 2)}`);

  // Conform performing validation
  if (submission.intent !== "submit") {
    console.log("action: conform is validating");
    return json({ status: "idle", submission } as const);
  }

  // Validation failed
  if (!submission.value) {
    console.log("action: validation failed");
    return json({ status: "error", submission } as const, { status: 400 });
  }

  // Validation succeeded
  console.log("action: validation passed");
  try {
    // insert the new ContributingFactor record into the database
    await createContributingFactor(submission.value.name);
  } catch (err) {
    console.error(err);
    throw new Response(
      `Failed to create Contributing Factor: "${submission.payload.name}"`,
      {
        status: 500,
      },
    );
  }

  return json({
    status: "success",
    submission: {
      ...submission,
      // Setting the payload to null notifies conform to reset the form on the client.
      payload: null,
    },
  } as const);
}
