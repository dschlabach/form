import type { FormState, FormOptions } from '@tanstack/form-core'
import { FormApi, functionalUpdate } from '@tanstack/form-core'
import type { NoInfer } from '@tanstack/react-store'
import { useStore } from '@tanstack/react-store'
import React from 'react'
import { type UseField, type FieldComponent, Field, useField } from './useField'
import { formContext } from './formContext'

export type FormSubmitEvent = React.FormEvent<HTMLFormElement>

declare module '@tanstack/form-core' {
  interface Register {
    FormSubmitEvent: FormSubmitEvent
  }

  // eslint-disable-next-line no-shadow
  interface FormApi<TFormData> {
    Provider: (props: { children: any }) => any
    getFormProps: () => FormProps
    Field: FieldComponent<TFormData, TFormData>
    useField: UseField<TFormData>
    useStore: <TSelected = NoInfer<FormState<TFormData>>>(
      selector?: (state: NoInfer<FormState<TFormData>>) => TSelected,
    ) => TSelected
    Subscribe: <TSelected = NoInfer<FormState<TFormData>>>(props: {
      selector?: (state: NoInfer<FormState<TFormData>>) => TSelected
      children:
        | ((state: NoInfer<TSelected>) => React.ReactNode)
        | React.ReactNode
    }) => any
  }
}

export type FormProps = {
  onSubmit: (e: FormSubmitEvent) => void
  disabled: boolean
}

export function useForm<TData>(opts?: FormOptions<TData>): FormApi<TData> {
  const [formApi] = React.useState(() => {
    // @ts-ignore
    const api = new FormApi<TData>(opts)

    api.Provider = (props) => (
      <formContext.Provider {...props} value={{ formApi: api }} />
    )
    api.getFormProps = () => {
      return {
        onSubmit: formApi.handleSubmit,
        disabled: api.state.isSubmitting,
      }
    }
    api.Field = Field as any
    api.useField = useField as any
    api.useStore = (
      // @ts-ignore
      selector,
    ) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useStore(api.store, selector) as any
    }
    api.Subscribe = (
      // @ts-ignore
      props,
    ) => {
      return functionalUpdate(
        props.children,
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useStore(api.store, props.selector),
      ) as any
    }

    return api
  })

  formApi.useStore((state) => state.isSubmitting)
  formApi.update(opts)

  return formApi as any
}
