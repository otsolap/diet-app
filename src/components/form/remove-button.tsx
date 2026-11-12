export function RemoveButton({
  action,
  idName,
  idValue,
  label = "Remove",
  className,
}: {
  action: string;
  idName: string;
  idValue: string | number;
  label?: string;
  className: string;
}) {
  return (
    <form method="post" action={action}>
      <input type="hidden" name={idName} value={idValue} />
      <input type="hidden" name="intent" value="remove" />
      <button className={className} type="submit">
        {label}
      </button>
    </form>
  );
}
