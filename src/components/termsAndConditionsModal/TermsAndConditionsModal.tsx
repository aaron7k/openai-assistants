import React, { useState, useRef, useEffect } from "react";
import { TermsAndConditionsModalProps } from "../../types";

export const TermsAndConditionsModal: React.FC<
  TermsAndConditionsModalProps
> = ({ isOpen, onAccept, textBtn = "Aceptar Términos y Condiciones" }) => {
  const [canAccept, setCanAccept] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;

    if (isAtBottom && !canAccept) {
      setCanAccept(true);
    }
  };

  useEffect(() => {
    // Resetear el estado cuando se abre el modal
    if (isOpen) {
      setCanAccept(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-purple-900">
            Términos y Condiciones de Uso
          </h3>
        </div>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="overflow-y-auto flex-grow pr-4 mb-6 text-gray-700"
          style={{ maxHeight: "calc(70vh - 100px)" }}
        >
          <h4 className="text-lg font-semibold mb-3">
            TÉRMINOS Y CONDICIONES DE USO DE AUTOMATIZACIONES Y CONEXIÓN CON
            WHATSAPP
          </h4>

          <p className="mb-3">
            Fecha de última actualización: 9 de abril de 2025
          </p>

          <h5 className="font-semibold mt-4 mb-2">1. INTRODUCCIÓN</h5>
          <p className="mb-3">
            Estos Términos y Condiciones (en adelante, los "Términos") regulan
            el uso de los servicios de automatización conversacional
            proporcionados por Infragrowth AI, incluyendo la conexión y uso
            automatizado de cuentas de WhatsApp a través de asistentes de
            inteligencia artificial y proxies asegurados.
          </p>
          <p className="mb-3">
            Al utilizar nuestros servicios, aceptas cumplir con estos Términos,
            así como con los Términos del Servicio y Políticas de WhatsApp y
            Meta. (
            <a
              href="https://www.whatsapp.com/legal/channels-terms-of-service?lang=es_LA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 underline"
            >
              https://www.whatsapp.com/legal/channels-terms-of-service?lang=es_LA
            </a>
            ). Si no estás de acuerdo, no debes usar nuestros servicios.
          </p>

          <h5 className="font-semibold mt-4 mb-2">
            2. NATURALEZA DEL SERVICIO
          </h5>
          <p className="mb-3">
            Infragrowth AI actúa como proveedor de conversación, facilitando la
            automatización de interacciones a través de WhatsApp mediante una
            simulación del entorno de WhatsApp. Cada número conectado opera a
            través de un proxy dedicado y asegurado, que permite una experiencia
            fluida, privada y controlada para cada cliente.
          </p>

          <h5 className="font-semibold mt-4 mb-2">
            3. LIMITACIONES Y RESPONSABILIDADES
          </h5>
          <h6 className="font-medium mt-3 mb-2">3.1. Uso Ético y Legal</h6>
          <p className="mb-3">
            El usuario se compromete a utilizar los servicios de manera ética,
            legal y conforme a las políticas de WhatsApp, incluyendo pero no
            limitándose a:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li className="mb-2">
              No enviar spam ni mensajes masivos no solicitados.
            </li>
            <li className="mb-2">
              No incurrir en fraudes, estafas o prácticas engañosas.
            </li>
            <li className="mb-2">
              No difundir contenido violento, ofensivo, ilegal, discriminatorio
              o sexualmente explícito.
            </li>
            <li className="mb-2">
              No utilizar el servicio para fines de acoso, manipulación o
              actividades ilegales.
            </li>
          </ul>

          <h6 className="font-medium mt-3 mb-2">
            3.2. Infragrowth AI NO se hace responsable por:
          </h6>
          <ul className="list-disc ml-6 mb-3">
            <li className="mb-2">
              El mal uso del servicio por parte del usuario.
            </li>
            <li className="mb-2">
              Cualquier sanción, bloqueo o acción tomada por Meta o WhatsApp
              debido al incumplimiento de sus políticas.
            </li>
            <li className="mb-2">
              Daños, perjuicios o consecuencias legales derivadas del uso
              indebido del canal de comunicación.
            </li>
            <li className="mb-2">
              Contenido compartido a través de las automatizaciones
              implementadas.
            </li>
          </ul>

          <h5 className="font-semibold mt-4 mb-2">
            4. RELACIÓN CON WHATSAPP Y META
          </h5>
          <p className="mb-3">
            Infragrowth AI NO es un socio oficial de Meta ni forma parte del
            programa de API de WhatsApp Business. Nuestro sistema realiza una
            simulación automatizada de WhatsApp para facilitar la comunicación y
            el control por parte del usuario final.
          </p>
          <p className="mb-3">
            Reiteramos que el uso automatizado de WhatsApp está sujeto a las
            restricciones y condiciones de uso impuestas por Meta. Es
            responsabilidad exclusiva del cliente mantenerse informado y cumplir
            con dichas condiciones.
          </p>

          <h5 className="font-semibold mt-4 mb-2">
            5. RECOMENDACIONES IMPORTANTES
          </h5>
          <p className="mb-3">
            NO recomendamos ni avalamos el envío masivo de mensajes. Este tipo
            de uso puede resultar en la suspensión o bloqueo permanente del
            número por parte de WhatsApp.
          </p>
          <p className="mb-3">
            El sistema está diseñado para interacciones personalizadas,
            orgánicas y autorizadas por los usuarios finales. Cualquier otro uso
            puede comprometer la cuenta y violar las normas de Meta.
          </p>

          <h5 className="font-semibold mt-4 mb-2">
            6. DERECHOS DE INFRAGROWTH AI
          </h5>
          <p className="mb-3">
            Nos reservamos el derecho de suspender o cancelar el acceso a
            nuestros servicios si se detecta un uso indebido, inadecuado o que
            represente un riesgo para nuestra infraestructura, reputación o para
            los términos de terceros (como WhatsApp o Meta).
          </p>

          <h5 className="font-semibold mt-4 mb-2">7. ACEPTACIÓN</h5>
          <p className="mb-3">
            El uso de nuestros servicios implica que el usuario:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li className="mb-2">Acepta estos Términos en su totalidad.</li>
            <li className="mb-2">
              Comprende los riesgos asociados con la automatización de WhatsApp.
            </li>
            <li className="mb-2">
              Exime a Infragrowth AI de cualquier responsabilidad derivada del
              uso inapropiado o no autorizado de nuestras herramientas.
            </li>
          </ul>

          <h5 className="font-semibold mt-4 mb-2">8. CONTACTO</h5>
          <p className="mb-3">
            Para más información o aclaraciones, puedes comunicarte con nosotros
            en:
          </p>
          <p className="mb-1">Email: soporte@infragrowthai.com</p>
          <p className="mb-3">Sitio web: www.infragrowthai.com</p>

          <p className="mb-3 mt-6 italic">
            Estos Términos pueden ser modificados sin previo aviso. Se
            recomienda revisarlos periódicamente.
          </p>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="mb-3 font-medium">
              Para consultar nuestra Política de Privacidad y proteción de
              datos, por favor descargue el documento a continuación:
            </p>
            <a
              href="/src/policy.pdf"
              download="politica-privacidad-infragrowthai.pdf"
              className="text-purple-600 hover:text-purple-800 underline font-medium"
            >
              Descargar Política de Privacidad
            </a>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="submit"
            onClick={onAccept}
            disabled={!canAccept}
            className={`px-4 py-2 text-white rounded-md ${
              canAccept
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-purple-300 cursor-not-allowed"
            }`}
          >
            {textBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;
