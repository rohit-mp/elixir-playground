defmodule HelloWeb.RoomChannel do
  use HelloWeb, :channel

  def join("room:lobby", payload, socket) do
    if authorized?(payload) do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("get_my_id", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("compile", payload, socket) do
    IO.inspect(payload["code"])
    IO.inspect(System.cmd("/bin/sh", ["-c", " echo '" <> payload["code"] <> "' > " <> " temp.c "]))
    IO.inspect("copied")
    IO.inspect(System.cmd("cc", ["temp.c", "-o", "temp"]))
    IO.inspect("compiled")
    {output, status} = System.cmd("/home/rohit/cloned/elixir-playground/hello/temp", [])
    IO.inspect(output)
    IO.inspect("executed")
    payload = Map.put(payload, "output", output)
    IO.inspect(payload)
    {:reply, {:ok, payload}, socket}
  end

  # It is also common to receive messages from the client and
  # broadcast to everyone in the current topic (room:lobby).
  def handle_in("shout", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    broadcast socket, "shout", payload
    {:noreply, socket}
  end

  def handle_in("updateCursor", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    broadcast socket, "updateCursor", payload
    {:noreply, socket}
  end

  def handle_in("createCursor", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    broadcast socket, "createCursor", payload
    {:noreply, socket}
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end