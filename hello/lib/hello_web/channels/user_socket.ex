defmodule HelloWeb.UserSocket do
  use Phoenix.Socket, log: :debug

  ## Channels
  # channel "room:*", HelloWeb.RoomChannel
  channel "room:lobby", HelloWeb.RoomChannel

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  def connect(params, socket, connect_info) do
    IO.inspect params
    IO.inspect params["token"]
    IO.inspect connect_info
    {:ok, socket}
    # {:ok, assign(socket, :user_id, params["user_id"])}
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     HelloWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  def id(_socket), do: nil
  # def id(socket) do
  #     IO.inspect socket.assigns.user_id
  #    "user_socket:#{socket.assigns.user_id}"
  # end
end
