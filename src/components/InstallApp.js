import React, { useEffect, useState } from "react";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";

import { useDeviceInfos } from "./ConnectDevice";
import Button from "./Button";
import DisplayError from "./DisplayError";
import Spaced from "./Spaced";
import HidProxy from "../HidProxy";
import remapError from "../logic/remapError";

const appToInstall = {
  targetId: 0x31010004,
  perso: "perso_11",
  delete_key: "blue/2.1.1-ee/vault3/app_del_key",
  firmware: "blue/2.1.1-ee/vault3/app_latest",
  firmware_key: "blue/2.1.1-ee/vault3/app_latest_key",
};

const appToUnInstall = {
  targetId: 0x31010004,
  perso: "perso_11",
  delete: "blue/2.1.1-ee/vault3/app_del",
  delete_key: "blue/2.1.1-ee/vault3/app_del_key",
};

export default ({ onBack }) => {
  const infos = useDeviceInfos();
  const [msg, setMsg] = useState("uninstalling current app...");
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let sub;
    async function effect() {
      const transport = await HidProxy.open();
      const handleError = err => setError(remapError(err));
      sub = uninstallApp(transport, infos.targetId, appToUnInstall).subscribe({
        complete: () => {
          setMsg("installing latest app...");
          installApp(transport, infos.targetId, appToInstall).subscribe({
            next: evt => {
              setMsg(
                `installing latest app... ${Math.round(evt.progress * 100)}%`,
              );
            },
            complete: () => setCompleted(true),
            error: handleError,
          });
        },
        error: handleError,
      });
    }
    effect();
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, []);

  const Back = () => <Button onClick={onBack}>Go back</Button>;

  if (completed) {
    return (
      <Spaced of={20}>
        <div>Install successful.</div>
        <Back />
      </Spaced>
    );
  }

  if (error) {
    return (
      <Spaced of={20}>
        <DisplayError error={error} />
        <Back />
      </Spaced>
    );
  }

  return msg;
};
